var express   =   require( 'express' );
var multer    =   require( 'multer' );
var upload    =   multer( { dest: 'uploads/' } );
var sizeOf    =   require( 'image-size' );
var jsonfile    =   require( 'jsonfile' );
var request    =   require( 'request' );
var dotenv = require('dotenv').config();
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const app = express();
var bodyParser = require('body-parser')

app.use(express.static( __dirname + '/docs'));

const crypto = require('crypto')
var csrftoken = crypto.randomBytes(48).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');

app.post('/init', function(req, res) {

	console.log(req.headers.host);

	setTimeout(function(){
		var success = false;
		if (req.headers.bearer !== undefined) {
			jsonfile.readFile("docs/config.json", function(err, obj) {
				if (req.headers.bearer === obj.inittoken) {
					return res.header("Access-Control-Allow-Methods", "POST").header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization").header("Access-Control-Allow-Origin", "*").json(csrftoken);
				}
				if (req.headers.bearer !== obj.inittoken) {
					return res.header("Access-Control-Allow-Methods", "POST").header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization").header("Access-Control-Allow-Origin", "*").json(false);
				}
			})
		}
		if (req.headers.bearer === undefined) {
			return res.json(false);
		}

	}, 50);
});

app.post('/status', function(req, res) {
	// console.log(req.headers.bearer);
	// console.log(req.headers.filename);

	if (csrftoken === req.headers.bearer) {
		fs.stat(path.join("uploads",req.headers.filename + ".json"), function(err, stats) {
			if (err !== null) {
				return res.json(false);
			}

			if (err === null) {

				if (Date.now() - stats.atimeMs <= 3000) {
					jsonfile.readFile(path.join("uploads",req.headers.filename + ".json"), function(err, obj) {
						if (err) {
							return res.json(false);
						}
						if (err === null) {
							return res.json(obj);
						}
					})
				}
				if (Date.now() - stats.atimeMs >= 3001) {
					return res.json();
				}

			}
		});

	}
	if (csrftoken !== req.headers.bearer) {
		return res.json(false);
	}
});

app.listen(process.env.PORT || process.env.port || 5045, function () {
	console.log('> http://localhost:5045/')
})

app.post( '/upload', upload.single( 'file' ), function( req, res, next ) {

	if (csrftoken === req.headers["x-csrf-token"] && req.headers["content-length"] !== undefined) {

		if (req.file.mimetype !== "image/jpeg") {
			return res.status( 422 ).json( {
				error : 'The uploaded file must be an image'
			})
		}

		var dimensions = sizeOf( req.file.path );

		if ( ( dimensions.width < 640 ) || ( dimensions.height < 480 ) ) {
			return res.status( 422 ).json({
				error : 'The image must be at least 640 x 480px'
			});
		}

		Jimp.read(req.file.path, function (err, image) {
			if (err) throw err;
			image.scaleToFit( 1800, 1800 )           // resize
				 .quality(90)                 // set JPEG quality
				 .exifRotate()
				 .getBuffer( Jimp.MIME_JPEG, function (err, buffer) {
					 parseImage(buffer,req.file.path);
				 });
		});

		return res.status( 200 ).send( req.file );

	}

	function parseImage(buffer,path) {
		request({
			headers: {
				'Content-Type': 'application/octet-stream',
				'Ocp-Apim-Subscription-Key': process.env.ms_emo_api_key
			},
			uri: 'https://westeurope.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=true&returnFaceAttributes=age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure,noise',
			body: buffer,
			method: 'POST',
			encoding: 'binary'
		}, function (err, res,body) {
			if (err) {
				console.error("err> " + err);
			}
			try {
				var response = JSON.parse(body);
				if (response.length >= 1) {
					jsonfile.writeFile(path + ".json", response, function (err) {
  						console.error(err)
					})
				}
			} catch (e) {}
		});
	}


	if (csrftoken !== req.headers["x-csrf-token"] || req.headers["content-length"] === undefined) {
		return res.json({})
	}

});
