var mongoose = require("mongoose");

// SCHEMA SETUP
var postSchema = new mongoose.Schema({
    // image: String,
    // author:String,
    content: String,
    comments: [
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "Comment"
        }
    ],
    createdAt: {
        type: Date,
        default: new Date()
    },
    author: {
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username:String,
        profilepic:String
    }
});

module.exports = mongoose.model("BlogPost", postSchema);