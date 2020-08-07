var multer = require('multer');
var multerS3 = require('multer-s3');   
var aws = require('aws-sdk');
require('dotenv').config();

// s3 config
var s3 = new aws.S3(
    {
        accessKeyId:process.env.AWS_ACCESS_ID,
        secretAccessKey:process.env.AWS_ACCESS_PW,
        region: 'us-west-1'
    }
)

const imageFilter = function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = "Forbidden extension";
        return cb(null, false, req.fileValidationError);
    } else {
        cb(null, true);
    }
};

var upload = multer({fileFilter: imageFilter,
    limits: 200000,
    storage: multerS3({
        s3: s3,
        bucket: 'instatweet-profile',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: "profile_pic"});
        },
        key: function (req, file, cb) {
            cb(null, `${Date.now().toString()}-${file.originalname}`)
        }
    })
})

module.exports = upload;