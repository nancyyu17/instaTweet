var express = require("express");
var router = express.Router();
var BlogPost = require("../models/post");
var User = require("../models/user");
var middleWare = require("../middleware/index");
var async = require("async"); // for password reset
var nodemailer = require("nodemailer"); // for password reset
var crypto = require("crypto");// for password reset
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var imgUpload = require("../services/img_upload");
require('dotenv').config();


router.post("/:username/follow", middleWare.isLoggedIn, function(req,res){
    User.findOne({username:req.params.username}, function(err, user){
        if (!user){
            req.flash("error", "User not found");
            res.status(404).render("notfound")
        } else {
            // check if request users following themselves
            if (!req.user._id.equals(user._id)){
                // update request user's following array
                User.findById(req.user._id, function(err, foundUser){
                    if(err){
                        res.redirect("back");
                    } else {
                        if (foundUser.following.some(person => person._id.equals(user._id))){
                            req.flash("error", "You've already followed this user.");
                            return res.redirect("back");
                        }
                    
                        foundUser.following.push(user)
                        foundUser.save();

                        // update user's followers array
                        user.followers.push(foundUser);
                        user.save();
                    }
                })
                
            } 
        }
    });
    res.redirect("/" + req.params.username + "/blogposts" );
});

router.post("/:username/unfollow", middleWare.isLoggedIn,function(req,res){
    
    User.findOne({username:req.params.username}, function(err, user){
        if (!user){
            req.flash("error", "User not found");
            res.status(404).render("notfound")
        } else {
            // check if request users unfollowing themselves
            if (!req.user._id.equals(user._id)){
                // update request user's following array
                User.findById(req.user._id, function(err, foundUser){
                    if(err){
                        res.redirect("back");
                    } else {
                        // remove user from request user's following array
                        for (var i = 0; i < foundUser.following.length; i++){
                            if (foundUser.following[i]._id.equals(user._id)){
                                foundUser.following.splice(i, 1);
                                break;
                            }
                        }
                        foundUser.save();

                        // update user's followers array
                        for (var i = 0; i < user.followers.length; i++){
                            if (user.followers[i]._id.equals(foundUser._id)){
                                user.followers.splice(i, 1);
                                break;
                            }
                        }
                        user.save();
                    }
                })
                
            } 
        }
    });
    res.redirect("/" + req.params.username + "/blogposts" );
});

router.get("/:id/profile", csrfProtection, middleWare.isLoggedIn, middleWare.checkProfileOwnership,function(req,res){
    User.findById(req.user._id, function(err, foundUser){
        if (err){
            res.status(404).render("notfound")
        } else {
            res.render("users/index", {user:foundUser, csrfToken: req.csrfToken()})
        }
    });

});


// get edit profile page
router.get("/:id/profile/editphoto", middleWare.isLoggedIn, middleWare.checkProfileOwnership,function(req,res){
    User.findById(req.params.id, function(err, foundUser){
        if (err){
            res.status(404).render("notfound")
        } else {
            res.render("users/editphoto", {user:foundUser})
        }
    });
    
})

// post for edit profile
router.post("/:id/profile/editphoto", middleWare.isLoggedIn, middleWare.checkProfileOwnership,imgUpload.single('profile_pic'), function(req, res){
    // upload profile photo to s3
    if (req.fileValidationError || !req.file){
        req.flash("error", "Invalid file type.")
        return res.redirect("back");
    }
    User.findById(req.params.id, function(err, foundUser){
        if (err){
            res.status(404).render("notfound");
        } else {
            foundUser.profilepic = req.file.location;
            foundUser.save();
        }
        BlogPost.find({'author.id': foundUser._id}, function(err, posts){
            if (posts){
                for (var i = 0; i < posts.length; i++){
                    posts[i].author.profilepic = req.file.location;
                    posts[i].save();
                }
            } 
        });
    });
    
    req.flash("success", "You've updated your profile photo.");
    res.redirect("/" + req.params.id + "/profile/editphoto");
})


// edit profile put route
router.put("/:id/profile",csrfProtection, middleWare.isLoggedIn, middleWare.checkProfileOwnership,function(req,res){
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
        if(err){
            req.flash("error", "Failed to update your information.");
            res.redirect("back");
        } else {
            req.flash("success", "You've successfully updated your profile.");
            res.redirect("/" + req.params.id + "/profile");
        }
    });
});


router.get("/:id/profile/history", csrfProtection, middleWare.isLoggedIn, middleWare.checkProfileOwnership,function(req,res){
    User.findById(req.user._id).populate("blogposts").exec(function(err, foundUser){
        if (err){
            res.status(404).render("notfound")
        } else {
            res.render("users/blogposts", {user:foundUser, csrfToken: req.csrfToken()})
        }
    });

});

router.get("/:id/profile/followers", csrfProtection,function(req,res){
    User.findById(req.params.id).populate("followers").exec(function(err, foundUser){
        if (err){
            res.status(404).render("notfound")
        } else {
            res.render("users/followers", {user:foundUser, csrfToken: req.csrfToken()})
        }
    });

});

router.get("/:id/profile/following", csrfProtection,function(req,res){
    User.findById(req.params.id).populate("following").exec(function(err, foundUser){
        if (err){
            res.status(404).render("notfound")
        } else {
            res.render("users/following", {user:foundUser, csrfToken: req.csrfToken()})
        }
    });

});

// delete blogpost from profile page
router.delete("/:id/profile/history/:blog_id",csrfProtection, middleWare.isLoggedIn, middleWare.checkProfileOwnership, middleWare.userIsVerified,function(req,res){ 
    BlogPost.findByIdAndRemove(req.params.blog_id, function(err){
        if(err){
            res.status(404).render("notfound")
        } else {
            res.redirect("/" + req.params.id + "/profile/history");
        }
    });
});



// remove followers from req user's profile page
router.post("/:id/profile/followers/:follower_id", csrfProtection,middleWare.isLoggedIn, middleWare.checkProfileOwnership,function(req,res){
    User.findById(req.user._id, function(err, user){
        if (err){
            req.flash("error", "User not found");
            res.redirect("back");
        } else {
            // remove this follower from req user's followers list
            for (var i = 0; i < user.followers.length; i++){
                if (user.followers[i]._id.equals(req.params.follower_id)){
                    user.followers.splice(i, 1);
                    break;
                }
            }
            user.save();

            // remove req user from this follower's following list
            User.findById(req.params.follower_id, function(err, follower){
                if (err){
                    req.flash("error", "User not found");
                    res.redirect("back");
                } else {
                    for (var i = 0; i < follower.following.length; i++){
                        if (follower.following[i]._id.equals(req.user._id)){
                            follower.following.splice(i, 1);
                            break;
                        }
                    }
                    follower.save();
                }
            });

        }
    });
    res.redirect("/" + req.params.id + "/profile/followers" );
})


// unfollow at the req user profile page
router.post("/:id/profile/following/:follow_id", csrfProtection, middleWare.isLoggedIn, middleWare.checkProfileOwnership,function(req,res){
    User.findById(req.user._id, function(err, user){
        if (err){
            req.flash("error", "User not found");
            res.redirect("back");
        } else {
            // unfollow req.params.follower_id
            User.findById(req.params.follow_id, function(err, foundUser){
                if(err){
                    res.redirect("back");
                } else {
                    // remove req user from foundUser's followers array
                    for (var i = 0; i < foundUser.followers.length; i++){
                        if (foundUser.followers[i]._id.equals(user._id)){
                            foundUser.followers.splice(i, 1);
                            break;
                        }
                    }
                    foundUser.save();

                    // remove foundUser from request user's following array
                    for (var i = 0; i < user.following.length; i++){
                        if (user.following[i]._id.equals(foundUser._id)){
                            user.following.splice(i, 1);
                            break;
                        }
                    }
                    user.save();
                }
            });
        }
    });

    res.redirect("/" + req.params.id + "/profile/following" );
})


router.get("/friends", function(req,res){
    if (req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        User.find({"username": regex}, function(err, users){
            if (err){
                res.redirect("back");
            } else {
                res.render("users/search", {users: users});
            }
        })
    } else {
        req.flash("error", "please enter a name");
        res.redirect("back");
    }

});


// forgot password
router.get("/forgotpassword",csrfProtection, function(req,res){
    if (req.isAuthenticated()){
        req.flash('error', "You do not have the permission.")
        res.redirect("back");
    } else {
        res.render("users/forget", {csrfToken: req.csrfToken()});
    }
    
})

// forgot password post request
// send out url to user's email to reset password
router.post('/forgotpassword', csrfProtection,function(req, res, next) {
    if (req.isAuthenticated()){
        req.flash('error', "You do not have the permission.")
        return res.redirect('/blogposts');
    } else {
        
        async.waterfall([
        function(done) {
            // generate random token
            crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
            });
        },
        function(token, done) {
            // email not found
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    req.flash('error', 'No account found for this email. Please enter a correct email address.');
                    return res.redirect('/forgotpassword');
                }
        
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000;
        
                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        // send out reset password email using Gmail service
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
                user: process.env.GMAILSENDER,
                pass: process.env.GMAILPSWD
            }
            });
            var mailOptions = {
            to: user.email,
            from: process.env.GMAILSENDER,
            subject: '[InstaTweet] Password Reset',
            text: "You're receiving this e-mail because you or someone else has requested a password reset for your user account \n\n" +
                'Click the link below to reset your password:\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request a password reset you can safely ignore this email.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
            // console.log('mail sent');
            req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
            done(err);
            });
        }
        ], function(err) {
            if (err) return next(err);
            res.redirect('/forgotpassword');
        });
    }
  });

// reset password route
router.get('/reset/:token', csrfProtection, function(req, res) {
    if (req.isAuthenticated()){
        req.flash('error', "You do not have the permission.")
        return res.redirect('/blogposts');
    } else {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgotpassword');
        }

        res.render('users/resetpw', {token: req.params.token, csrfToken: req.csrfToken()});
        });
    }
});

// reset password post request
router.post('/reset/:token', csrfProtection,function(req, res) {
    if (req.isAuthenticated()){
        req.flash('error', "You do not have the permission.")
        return res.redirect('/blogposts');
    } else {
        async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if(req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function(err) {
                        if (err){
                            console.log(err);
                            req.flash('error', err.message);
                        }
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        
                        user.save();
                        // console.log("saved user");
                        req.logIn(user, function(err){
                            if (err){
                                console.log(err);
                                req.flash('error', err.message);
                            } else {
                                // console.log("logging in user");
                                done(err, user);
                            }
                            
                        });
                    });
                    
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });
        },
        function(user,done) {
            var smtpTransport = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
                user: process.env.GMAILSENDER,
                pass: process.env.GMAILPSWD
            }
            });
            var mailOptions = {
                to: user.email,
                from: process.env.GMAILSENDER,
                subject: 'Your password has been changed',
                text: 'Hello ' + user.username + '\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                done(err,user);
            });
        }], function(err, user) {
            if (err){
                console.log(err)
            } else {
                req.flash('success', 'Success! Your password has been changed.');
                res.redirect("/" + user.username + "/blogposts");
            }
            
        });
    }
});


// change password for signed in user
router.get("/:id/changepassword",csrfProtection,middleWare.isLoggedIn, middleWare.checkProfileOwnership, function(req,res){
    res.render("users/changepw",{id: req.user._id, csrfToken: req.csrfToken()});
});

// change password post request
router.post('/:id/changepassword',csrfProtection, middleWare.isLoggedIn, middleWare.checkProfileOwnership, function(req, res) {
    if (req.body.currpassword.length < 1 || req.body.password.length < 1 || req.body.confirm.length < 1){
        req.flash('error', 'Empty input');
        return res.redirect("/" + req.params.id + "/changepassword");
    }


    User.findById(req.params.id, function(err, user){
        if (!user){
            req.flash("error", "User not found");
            return res.redirect("back");
        }

        if(req.body.password === req.body.confirm) {
            user.changePassword(req.body.currpassword, req.body.password, function(err) {
                if (err.name === 'IncorrectPasswordError'){
                    req.flash('error', "Current password is incorrect.");
                    res.redirect("/" + req.params.id + "/changepassword");
                } else {
                    req.flash("success", "Your password has been updated.");
                    res.redirect("/" + req.params.id + "/changepassword");
                }
                
            });
        } else {
            req.flash("error", "New passwords do not match.");
            res.redirect("/" + req.params.id + "/changepassword");
        }
    });

});


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};



module.exports = router;
