BlogPost = require("../models/post");
Comment = require("../models/comment");
User = require("../models/user");
var middlewareObj = {};

middlewareObj.isLoggedIn = function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please log in first");
    res.redirect("/login");
}

middlewareObj.userIsVerified = function(req, res, next){
    if(req.user != null && req.isAuthenticated()){
        User.findById(req.user._id, function(err, foundUser){
            if(err){
                res.redirect("back");
            } else {
                if (foundUser.isVerified){
                    next();
                } else {
                    req.flash("error", "Please verify your email address to have the permission.");
                    res.redirect("back");
                }
            }
        });
    }else {
        req.flash("error", "Please log in first");
        res.redirect("back");
    }
}

middlewareObj.checkBlogOwnership = function(req,res,next){
    if(req.user != null && req.isAuthenticated()){
        BlogPost.findById(req.params.id, function(err, foundBlogpost){
            if(err){
                res.status(404).render("notfound")
            } else{
                // is this user own this post?
                if(foundBlogpost.author.id.equals(req.user._id)){
                    next(); // move onto the code that this function was called
                } else {
                    req.flash("error", "You don't have the permission");
                    res.redirect("back");
                }
            }
        });
    }else {
        req.flash("error", "Please log in first");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req,res,next){
    if(req.user != null && req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                res.status(404).render("notfound")
            } else{
                // is this user own this post?
                if(foundComment.author.id.equals(req.user._id)){
                    next(); // move onto the code that this function was called
                } else {
                    req.flash("error", "You don't have the permission");
                    res.redirect("back");
                }
            }
        });
    }else {
        req.flash("error", "Please log in first");
        res.redirect("back");
    }
}

middlewareObj.checkProfileOwnership = function(req,res,next){
    if(req.isAuthenticated()){
        User.findById(req.params.id, function(err, foundUser){
            if(err){
                res.status(404).render("notfound")
            } else{
                // is this user own this post?
                if(foundUser._id.equals(req.user._id)){
                    next(); // move onto the code that this function was called
                } else {
                    req.flash("error", "You don't have the permission");
                    res.redirect("back");
                }
            }
        });
    }else {
        req.flash("error", "Please log in first");
        res.redirect("/login");
    }
}


module.exports = middlewareObj;