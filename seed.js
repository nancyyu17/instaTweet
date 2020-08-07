var mongoose = require("mongoose");
var Blogpost = require("./models/post");
var Comment = require("./models/comment");

var data = [
    {author:"user1", content: "this is the first post ever!"},
    {author:"user1",content: "this is the second post ever!"},
    {author:"user1",content: "hello dear, I'm just adding random content here."}]


function seedDB(){
   //Remove all campgrounds
    Blogpost.remove({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("removed posts!");
        Comment.remove({}, function(err) {
            if(err){
                console.log(err);
            }
            console.log("removed comments!");
            //  add a few campgrounds
            data.forEach(function(seed){
                Blogpost.create(seed, function(err, post){
                    if(err){
                        console.log(err)
                    } else {
                        console.log("added a post");
                        // create a comment
                        Comment.create(
                            {
                                text: "This place is great, but I wish there was internet",
                                author: "Homer"
                            }, function(err, comment){
                                if(err){
                                    console.log(err);
                                } else {
                                    post.comments.push(comment);
                                    post.save();
                                    console.log("Created new comment");
                                }
                            });
                    }
                });
            });
        });
    }); 

};
 
module.exports = seedDB;