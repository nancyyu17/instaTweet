var express = require("express");
var router = express.Router();
var BlogPost = require("../models/post");
var Comment = require("../models/comment");
var User = require("../models/user");
var middleWare = require("../middleware/index");
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

// get request
// serve as the EXPLORE page
router.get("/blogposts",function(req, res){
    // get all most recent 50 posts from the newsfeed array in BlogPost Schema
    var count = 10;
    var pageQuery = parseInt(req.query.page);
    var pageNum = pageQuery ? pageQuery : 1;
    BlogPost.find({}).skip(count * pageNum - count).limit(count).sort({createdAt: 'desc'}).exec(function(err, blogposts){
        BlogPost.countDocuments().exec(function(err, total) { 
            if (err){
                console.log(err);
            } else {
                res.render("blogposts/explore", {blogposts: blogposts, currentPage: pageNum, pages: Math.ceil(total/count)});
            }
        });
        
    })
    
});

// get request for specific user
router.get("/:username/blogposts", csrfProtection,function(req,res){
    // console.log(req.user)
    var username = req.params.username;
    var unfollow = false;
    
    User.findOne({username:username}).populate("newsfeed blogposts").exec(function(err, foundUser){
        if (!foundUser){
            res.status(404).render("notfound")
        } else {

            if (req.user != null && req.user.following.some(person => person._id.equals(foundUser._id))){
                unfollow = true;
            }
            res.render("blogposts/index", {user:foundUser, unfollow: unfollow, csrfToken: req.csrfToken()});
        }
    });

});


// post functionality on a usesr's own page
router.post("/:username/blogposts", csrfProtection, middleWare.isLoggedIn, middleWare.userIsVerified,function(req,res){
    User.findOne({username: req.params.username}, function(err, user){
        if(!user){
            res.status(404).render("notfound")
        } else if (req.user.id != user._id){
            req.flash("error", "Please get back to your homepage to make a post.")
            res.redirect("back");
        } else {
            BlogPost.create(req.body.blogpost, function(err, blogpost){
                if (err){
                    req.flash("error", "Something went wrong...");
                    res.redirect("back");
                } else {
                    blogpost.author.id = user._id
                    blogpost.author.username = user.username;
                    blogpost.author.profilepic = user.profilepic;
                    blogpost.save();
                    
                    // push new blogpost into this user's blogposts array
                    user.blogposts.unshift(blogpost);

                    // push this blogpost to the front of this user's newsfeed
                    if (user.newsfeed.length >= 50){
                        user.newsfeed.pop()
                    }
                    user.newsfeed.unshift(blogpost)
                    user.save();

                    // also followers' newsfeeds
                    user.followers.forEach(follower=> {
                        User.findById(follower._id, function(err, user){
                            if (user.newsfeed.length >= 50){
                                user.newsfeed.pop()
                            }
                            user.newsfeed.unshift(blogpost)
                            user.save();
                        });
                    });
                }
            })
            req.flash("success", "You've successfully made a new post!");
            res.redirect("/" + user.username + "/blogposts");
        }
    })
});



// Show specific post with comments
router.get("/blogposts/:id", csrfProtection, middleWare.isLoggedIn,function(req,res){
    BlogPost.findById(req.params.id).populate("comments").exec(function(err, foundBlogPost){
        if (err){
            res.status(404).render("notfound")
        } else {
            res.render("blogposts/show", {blogpost: foundBlogPost, csrfToken: req.csrfToken()});
        }
    });

});

// post a comment
router.post("/blogposts/:id", csrfProtection, middleWare.isLoggedIn, middleWare.userIsVerified, function(req,res){
    BlogPost.findById(req.params.id, function(err, blogpost){
        if(err){
            res.status(404).render("notfound")
        } else{
            Comment.create(req.body.comment, function(err,comment){
                if(err){
                    req.flash("error", "Failed. something went wrong")
                    res.redirect("back");
                }else{
                    // add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    // comment.author = "samePerson";
                    comment.save();
                    // push comment into comments schema
                    blogpost.comments.push(comment);
                    blogpost.save();

                    req.flash("success", "Successfully added a comment!")
                    res.redirect('/blogposts/' + blogpost._id);
                }
            });
        }
    });
});

// get edit page
router.get("/blogposts/:id/edit", csrfProtection, middleWare.checkBlogOwnership, middleWare.userIsVerified,function(req, res){

    BlogPost.findById(req.params.id, function(err, foundBlogpost){
        if(err){
            res.status(404).render("notfound")
        } else{
            res.render("blogposts/edit", {blogpost: foundBlogpost, csrfToken: req.csrfToken()});
        }
    });

    
});

// update blogpost
router.put("/blogposts/:id", csrfProtection, middleWare.checkBlogOwnership, middleWare.userIsVerified,function(req,res){
    // find and update the blogpost
    BlogPost.findByIdAndUpdate(req.params.id, req.body.blogpost, function(err, updatedBlogpost){
        if(err){
            res.status(404).render("notfound")
        } else {
            req.flash("success", "You've successfully updated the post");
            res.redirect("/blogposts/" + req.params.id);
        }
    });
});


// delete a blogpost
router.delete("/blogposts/:id", csrfProtection, middleWare.checkBlogOwnership, middleWare.userIsVerified,function(req,res){
    BlogPost.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.status(404).render("notfound")
        } else {
            req.flash("success", "You've successfully deleted the post");
            res.redirect("/" + req.user.username + "/blogposts");
        }
    });
});


module.exports = router;

