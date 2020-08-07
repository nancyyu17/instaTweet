var express = require("express");
var router = express.Router();
var Passport = require("passport");
var User = require("../models/user");
var nodemailer = require("nodemailer"); // for password reset
var crypto = require("crypto");// for password reset
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
require('dotenv').config();


// root route
router.get("/",csrfProtection,function(req, res){
    res.render("landing", {csrfToken: req.csrfToken()});
});


// authorization routes
router.get("/register", csrfProtection,function(req,res){
    res.render("register", {csrfToken: req.csrfToken()});
});


// sign up logic
router.post("/register", csrfProtection,function(req,res){
    // check if email exists or empty
    if (req.body.email.length < 1){
        req.flash("error", "Email address cannot be empty.")
        return res.redirect("/register");
    }
    
    
    // create user
    var newUser = new User({username: req.body.username, email: req.body.email, profilepic: process.env.PROFILE_DEFAULT, intro: req.body.intro, 
        createdAt:new Date()});
    
    // store the hash of password
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", "username or email is already registered");
            return res.redirect("/register");
        }

        // log user in
        Passport.authenticate("local")(req,res,function(){
            req.flash("success", "Welcome to InstaTweet " + user.username + ". Please also check your email inbox to verify your email address.");
            res.redirect("/" + req.user.username + "/blogposts");
        });
        
    });

    // send out email confirmation
    // generate random token
    crypto.randomBytes(20, (err, buf) => { 
        if (err)  
        { 
            console.log(err); 
        } 
        else
        { 
            var token = buf.toString('hex')
            newUser.verifyEmailToken = token
            // console.log(token);
            // console.log("user email token:" + newUser.verifyEmailToken)
            
            // send out confirmation email using Gmail service
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail', 
                auth: {
                    user: process.env.GMAILSENDER,
                    pass: process.env.GMAILPSWD
                }
                });
                var mailOptions = {
                to: newUser.email,
                from: process.env.GMAILSENDER,
                subject: '[InstaTweet] Email Verification',
                text: "Hey " + newUser.username + ",\nWe are thrilled to have you on board! Click the link below to verify your email. \n\n" +
                    'http://' + req.headers.host + '/verifyemail/' + newUser.verifyEmailToken + '\n\n' +
                    'The InstaTweet Team'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    if (err){
                        req.flash("error", err.message)
                        return res.redirect("back");
                    }
                });
        }
    })
});

// confirm email route
router.get('/verifyemail/:token', function(req, res) {
    User.findOne({ verifyEmailToken: req.params.token}, function(err, user) {
        if (!user) {
            req.flash('error', 'The email verification token is invalid.');
            return res.redirect('/register');
        }

        user.isVerified = true;
        user.verifyEmailToken = undefined;
        user.save();

        req.logIn(user, function(err){
            if (err){
                req.flash('error', 'Failed to log you in.');
                res.redirect("back");
            } else {
                req.flash('success', 'Your email has been verified!');
                res.redirect("/" + user.username + "/blogposts");
            }
        })
    });

});


// show login page
router.get("/login", csrfProtection, function(req,res){
    res.render("login", {csrfToken: req.csrfToken()});

});


// login logic
router.post("/login",csrfProtection,Passport.authenticate("local",
    {
        failureRedirect: "/login",
        failureFlash: true
    }), function(req,res){
        var user = req.user;
        req.flash("success", "Welcome back " + user.username);
        res.redirect("/" + user.username + "/blogposts");
    }
);



// for logout
router.get("/logout", function(req,res){
    req.logout();
    req.flash("success", "You've successfully logged out");
    res.redirect("/blogposts");
})




module.exports = router;