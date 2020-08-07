var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    Passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"), // for PUT and DELETE
    flash = require("connect-flash"),
    filter = require("content-filter"), // injection handling
    cookieParser = require('cookie-parser'),
    User = require("./models/user");


//require and configure dotenv
require('dotenv').config();

// routes
var commentRoutes = require("./routes/comment");
var indexRoutes = require("./routes/index");
var blogpostRoutes = require("./routes/blogpost");
var userRoutes = require("./routes/user");

// Database config
// mongoose.connect(process.env.DB_LOCAL_CONFIG,{ useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });
mongoose.connect(process.env.DB_CONFIG,
{ useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(cookieParser());


// Passport configuration
app.use(require("express-session")({
    secret: process.env.SECRET_PASSPORT,
    resave: false,
    saveUninitialized: false
}));

app.use(Passport.initialize());
app.use(Passport.session());
Passport.use(new LocalStrategy(User.authenticate()));
Passport.serializeUser(User.serializeUser());
Passport.deserializeUser(User.deserializeUser());



// let every route to recognize the currentUser
// also the error message
app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error= req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


// let every route recognize the filter rule
var blackList = ['$','&&','||']
var filterOptions = {
    methodList:['POST', 'PUT', 'DELETE'],
    urlBlackList: blackList,
    bodyBlackList:blackList,
    urlMessage: 'Unsupported symbol(s) found: ',
    bodyMessage: 'Unsupported symbol(s) found: ',
    dispatchToErrorHandler: true, // if this parameter is true, the Error Handler middleware below works
	appendFound: true // appending found forbidden characters to the end of default or user defined error messages
}
app.use(filter(filterOptions));


app.use(indexRoutes);
app.use(commentRoutes);
app.use(blogpostRoutes);
app.use(userRoutes);
app.use(function (err, req, res, next) {
    if (err.status === 403){
        req.flash("error", err.message)
        res.redirect("back")
    }
})
app.use(function (req, res, next) {
    res.status(404).render("notfound")
})


app.listen(process.env.PORT, function(){
    console.log("The blogpost server has started!");
});