require('dotenv-extended').load();
var fs = require('fs');
var oxford = require('project-oxford');
var Jimp = require('jimp');
var pngFileStream = require('png-file-stream');
var GIFEncoder = require('gifencoder');
var multer = require('multer');

var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Expose files available in public/images so they can be viewed in the browser. 
app.use('/public/images', express.static('public/images'));

// Use multer middleware to upload a photo to public/images
app.use(multer({dest: './public/images'}).single('userPhoto'));


app.use('/createbobblehead', function(req, res) {
    createBobblehead(req, res);
});
//app.use('/users', users);

function createBobblehead(req, res){
    var imgSrc = req.file ? req.file.path : '';
    Promise.resolve(imgSrc)
        .then(function detectFace(image) {
            var client = new oxford.Client(process.env.FACEAPI_KEY);
            return client.face.detect({path: image});
        })
        .then(function generateBobblePermutations(response) {
            var promises = [];
            var degrees = [10, 0, -10];

                for (var i = 0; i < degrees.length; i++) {
                    var outputName = req.file.path + '-' + i + '.png';
                    promises.push(cropHeadAndPasteRotated(req.file.path,
                        response[0].faceRectangle, degrees[i], outputName))
                }
            return Promise.all(promises);
        })
        .then(function generateGif(dimensions) {
            return new Promise(function (resolve, reject) {
                var encoder = new GIFEncoder(dimensions[0][0], dimensions[0][1]);
                pngFileStream(req.file.path + '-?.png')
                    .pipe(encoder.createWriteStream({ repeat: 0, delay: 500 }))
                    .pipe(fs.createWriteStream(req.file.path + '.gif'))
                    .on('finish', function () {
                        resolve(req.file.path + '.gif');
                    });
            })
        }).then(function displayGif(gifLocation) {
            res.send(gifLocation)
        });
}

function cropHeadAndPasteRotated(inputFile, faceRectangle, degrees, outputName) {
    return new Promise (function (resolve, reject) {
        Jimp.read(inputFile).then(function (image) {
            // Face detection only captures a small portion of the face,
            // so compensate for this by expanding the area appropriately.
            var height = faceRectangle['height'];
            var top = faceRectangle['top'] - height * 0.5;
            height *= 1.6;
            var left = faceRectangle['left'];
            var width = faceRectangle['width'];
 
            // Crop head, scale up slightly, rotate, and paste on original image
            image.crop(left, top, width, height)
            .scale(1.05)
            .rotate(degrees, function(err, rotated) {
                Jimp.read(inputFile).then(function (original) {
                    original.composite(rotated, left-0.1*width, top-0.05*height)
                    .write(outputName, function () {
                        resolve([original.bitmap.width, original.bitmap.height]);
                    });
                });
            });
        });
    });
}


module.exports = app;
