var express = require('express');
var Bitly = require('bitly');
var bitly = new Bitly(process.env.BITLY_API);

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Azure Bobblehead' });
});

// Required Dependencies
var fs = require('fs');
var oxford = require('project-oxford');
var Jimp = require('jimp');
var pngFileStream = require('png-file-stream');
var GIFEncoder = require('gifencoder');

// Handle POST request
router.post('/', function (req, res, next) {
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
                        resolve((req.file.path + '.gif').replace(/\134/g,"/"));
                    });
            })
        }).then(function buildShortURL(gifLocation){
            return new Promise(function (resolve, reject) {
                bitly.shorten("https://"+req.hostname+"/"+gifLocation)
                .then(function(response) {
                    var shorturl = response.data.url;
                    console.log(JSON.stringify(response));
                    console.log(shorturl);
                    resolve({"gifLocation": gifLocation, "shorturl": shorturl}); 
                });
            })
        }).then(function displayGif(locations) {
            console.log(locations.shorturl);
            res.render('index', { title: 'Done!', image: locations.gifLocation, shorturl: locations.shorturl })
        });
});

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

module.exports = router;
