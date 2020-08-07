var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    email: {type: String, unique: true, required: true},
    isVerified: { type: Boolean, default: false },
    password: String,
    profilepic: String,
    intro:String,
    createdAt: Date,
    blogposts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "BlogPost"
    }],
    following: [
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
        }
    ],
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    newsfeed:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BlogPost"
        }
    ],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verifyEmailToken: String

})

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);