# InstaTweet
This is a blogpost website developed with Nodejs and Mongodb. 

It's now deployed on AWS EC2. Visit the site [here](https://instatweet.cf/)

## Installation
```bash
npm install
```
run the app
```bash
node app.js
```
## Features
- [x] signup/signin
- [x] reset password/ change password
- [x] email confirmation
- [x] make/edit/delete posts
- [x] make/edit/delete comments
- [x] follow/unfollow friends
- [x] remove followers
- [x] Edit profile photos/self-intro


## Packages
(selected packages)
* passport
  * user authentication
* content-filter
  * filter out potential injection attack
* csurf, cookieParser
  * csrf protection
* multer, multer-s3
  * handles file uploads
* nodemailer
  * send out email confirmation

## Migrate to Production
- MongoDB Atlas: store most data of the website
- AWS S3 bucket: store users' profile photos uploaded from local
- AWS EC2: Apache server
