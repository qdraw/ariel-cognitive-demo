var express   =   require( 'express' );
var multer    =   require( 'multer' );
var upload    =   multer( { dest: 'uploads/' } );
var sizeOf    =   require( 'image-size' );
var jsonfile    =   require( 'jsonfile' );
var request    =   require( 'request' );
var dotenv = require('dotenv').config();
const sharp = require('sharp');

const app = express();
var bodyParser = require('body-parser')

app.use(express.static( __dirname + '/docs'));

const crypto = require('crypto')
var csrftoken = crypto.randomBytes(48).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');

app.post('/init', function(req, res) {
	setTimeout(function(){
		var success = false;
		if (req.headers.bearer !== undefined) {
			jsonfile.readFile("docs/config.json", function(err, obj) {
				if (req.headers.bearer === obj.inittoken) {
					return res.json(csrftoken);
				}
				if (req.headers.bearer !== obj.inittoken) {
					return res.json(false);
				}
			})
		}
		if (req.headers.bearer === undefined) {
			return res.json(false);
		}

	}, 50);
});


app.listen(process.env.PORT ||process.env.port || 5045, function () {
	console.log('> http://localhost:5045/')
})

app.post( '/upload', upload.single( 'file' ), function( req, res, next ) {

	console.log(req.headers);

	if (csrftoken === req.headers["x-csrf-token"] && req.headers["content-length"] !== undefined) {

		// if ( !req.file.mimetype.startsWith( 'image/' ) ) {
		// 		return res.status( 422 ).json( {
		// 			error : 'The uploaded file must be an image'
		// 		}
		// 	);
		// }

		var dimensions = sizeOf( req.file.path );

		if ( ( dimensions.width < 640 ) || ( dimensions.height < 480 ) ) {
			return res.status( 422 ).json({
				error : 'The image must be at least 640 x 480px'
			});
		}

		var image = sharp(req.file.path);
		image
			.withMetadata()
			.resize(1600,1600)
			.max()
			.rotate()
			.jpeg()
			.toBuffer(function(err, data, info) {
				if (err) {
					console.error(err);
					process.exit(1);
					return;
				}
				parseImage(data);
			});

		return res.status( 200 ).send( req.file );

	}

	function parseImage(buffer) {
		console.log(process.env.ms_emo_api_key);
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
				console.error(err);
			}

			try {
				var response = JSON.parse(body);
				if (response.length >= 1) {
					console.log(body);

				}
			} catch (e) {}
		});
	}





	if (csrftoken !== req.headers["x-csrf-token"] || req.headers["content-length"] === undefined) {
		return res.json({})
	}

});
