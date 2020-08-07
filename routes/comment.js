var express = require("express");
var router = express.Router({mergeParams:true});
var Comment = require("../models/comment");
var User = require("../models/user");
var BlogPost = require("../models/post");
var middleWare = require("../middleware/index");
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

//Edit comment
router.get("/blogposts/:id/comments/:comment_id/edit", csrfProtection, middleWare.isLoggedIn, middleWare.checkCommentOwnership, middleWare.userIsVerified,function(req,res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if (err){
            res.status(404).render("notfound")
        }
        res.render("comments/edit", {blogpost_id: req.params.id, comment: foundComment, csrfToken: req.csrfToken()});
    });
});

//update comment
router.put("/blogposts/:id/comments/:comment_id", csrfProtection, middleWare.isLoggedIn, middleWare.checkCommentOwnership, middleWare.userIsVerified,function(req,res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.status(404).render("notfound")
        } else {
            req.flash("success", "You've successfully updated the comment");
            res.redirect("/blogposts/" + req.params.id);
        }
    })
})

// delete comment
router.delete("/blogposts/:id/comments/:comment_id",csrfProtection, middleWare.isLoggedIn, middleWare.checkCommentOwnership, middleWare.userIsVerified,function(req,res){
    // remove the comment from the blogpost
    BlogPost.findById(req.params.id, function(err, blogpost){
        if (err){
            res.status(404).render("notfound")
        }
        for (var i = 0; i < blogpost.comments.length; i++){
            if (blogpost.comments[i]._id.equals(req.params.comment_id)){
                blogpost.comments.splice(i, 1);
                break;
            }
        }
        blogpost.save();
    });

    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.status(404).render("notfound")
        } else {
            req.flash("success", "Comment is successfully deleted");
            res.redirect("/blogposts/" + req.params.id);
        }
    })
});


module.exports = router;