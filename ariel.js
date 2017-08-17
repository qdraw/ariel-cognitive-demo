var express   =   require( 'express' );
var multer    =   require( 'multer' );
var upload    =   multer( { dest: 'uploads/' } );
var sizeOf    =   require( 'image-size' );
var jsonfile    =   require( 'jsonfile' );
var request    =   require( 'request' );
var dotenv = require('dotenv').config();
const Jimp = require('jimp');
const path = require('path');
var svg_to_png = require('svg-to-png');

const fs = require('fs');
var ExifImage = require('exif').ExifImage;
// const d3 = require('d3-node');

const app = express();
var bodyParser = require('body-parser')

app.use(express.static( __dirname + '/docs'));

const crypto = require('crypto')
var csrftoken = crypto.randomBytes(48).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
var inittoken = undefined;

app.use(function(req, res, next) {
	// console.log(req.headers.host);
	res.header("Access-Control-Allow-Credentials", true).header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT").header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, cache-control, x-csrf-token, filename, Authorization, Bearer").header("Access-Control-Allow-Origin", "*")
	next();
});

jsonfile.readFile("docs/config.json", function(err, data) {

	if (process.env.server === undefined) {
		console.error(">>>> please add server in .env");
		process.env.server = "http://localhost:5045/";
	}

	if (process.env.server !== undefined) {
		data.inittoken = new Buffer(process.env.server).toString('base64');
		inittoken = data.inittoken;
	}
	data.server = process.env.server;

	jsonfile.writeFile("docs/config.json", data, function (err) {
	  console.error(err)
	})
})


app.post('/init', function(req, res) {

	setTimeout(function(){
		var success = false;
		if (req.headers.bearer !== undefined) {
			if (req.headers.bearer === inittoken) {
				return res.json(csrftoken);
			}
			if (req.headers.bearer !== inittoken) {
				return res.json(false);
			}
		}
		if (req.headers.bearer === undefined) {
			return res.json(false);
		}

	}, 100);
});

app.post('/status', function(req, res) {

	if (csrftoken === req.headers.bearer) {
		fs.stat(path.join("uploads",req.headers.filename + ".svg"), function(err, stats) {
			if (err !== null) {
				return res.json(false);
			}

			if (err === null) {

				if (Date.now() - stats.atimeMs <= 3000) {
					res.sendFile(path.join(__dirname, "uploads",req.headers.filename + ".svg"));
				}
				if (Date.now() - stats.atimeMs >= 3001) {
					return res.json();
				}

			}
		});

	}
	if (csrftoken !== req.headers.bearer) {
		console.log("csrftoken !== req.headers.bearer");
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
					 getOrientation(req.file.path,function (Orientation) {
						 req.file.orientation = Orientation;
						//  req.file.dimensions = dimensions;
						 return res.status( 200 ).send( req.file );
					 })
				 });
		});


	}

	function parseImage(buffer,path) {
		request({
			headers: {
				'Content-Type': 'application/octet-stream',
				'Ocp-Apim-Subscription-Key': process.env.ms_emo_api_key
			},
			uri: 'https://westeurope.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=true&returnFaceAttributes=age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup',
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

					createSVGblob(response,buffer,function (svgString) {

						fs.writeFile(path + ".svg", svgString, (err) => {
							if (err) throw err;
							console.log('The file has been saved!');
						});
					})

					jsonfile.writeFile(path + ".json", response, function (err) {
						console.error(err)
					});
				}
			} catch (e) {}
		});
	}

	function createSVGblob(response,buffer,callback) {

		var dimensions = sizeOf( buffer );
		console.log(dimensions);

		const D3Node = require('d3-node');
		const d3n = new D3Node()      // initializes D3 with container element
		var svg = d3n.createSVG(dimensions.width,dimensions.height).append('g') // create SVG w/ 'g' tag and width/height

		for (var i = 0; i < response.length; i++) {
			console.log("faceId " + response[i].faceId);

			var gendertext =  response[i].faceAttributes.gender + " ";
			var agetext = "age: " + Math.round(response[i].faceAttributes.age) + " ";
			var emotion = "";

			if (response[i].faceAttributes.smile !== 0) {
				emotion += " +smile "
			}

			var emotionType = [];
			var emotionScore = [];

			emotionType.push("anger");
			emotionScore.push(response[i].faceAttributes.emotion.anger);
			emotionType.push("contempt");
			emotionScore.push(response[i].faceAttributes.emotion.contempt);
			emotionType.push("disgust");
			emotionScore.push(response[i].faceAttributes.emotion.disgust);
			emotionType.push("fear");
			emotionScore.push(response[i].faceAttributes.emotion.fear);
			emotionType.push("happiness");
			emotionScore.push(response[i].faceAttributes.emotion.happiness);
			emotionType.push("neutral");
			emotionScore.push(response[i].faceAttributes.emotion.neutral);
			emotionType.push("sadness");
			emotionScore.push(response[i].faceAttributes.emotion.sadness);
			emotionType.push("surprise");
			emotionScore.push(response[i].faceAttributes.emotion.surprise);

			// console.log(emotionType);
			// console.log(emotionScore);

			function findIndexOfGreatest(array) {
				var greatest;
				var indexOfGreatest;
				for (var i = 0; i < array.length; i++) {
					if (!greatest || array[i] > greatest) {
					greatest = array[i];
					indexOfGreatest = i;
					}
				}
				return indexOfGreatest;
			}

			var index = findIndexOfGreatest(emotionScore);
			emotion += "emotion: " + emotionType[index];

			var text = svg.append("text")
					.attr("x", response[i].faceRectangle.left)
					.attr("y", response[i].faceRectangle.top + response[i].faceRectangle.height  + 25)
					.style("fill", "white")
					.style("font-size", "20px")
					.attr("dy", ".35em")
					.attr("text-anchor", "left")
					.text(gendertext + agetext + emotion);

			if (response[i].faceLandmarks.pupilLeft.x !== undefined) {

				var rSize = Number(response[i].faceLandmarks.eyeRightOuter.x - response[i].faceLandmarks.eyeRightBottom.x)/4;
				console.log("rSize " + rSize);
				if (rSize <= 3) rSize = 3;

				var pupilLeft = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.pupilLeft.x)
					.attr("cy", response[i].faceLandmarks.pupilLeft.y)
					.attr("r", rSize)
					.style("fill", "rgba(255,255,255,0.4)");

				var pupilRight = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.pupilRight.x)
					.attr("cy", response[i].faceLandmarks.pupilRight.y)
					.attr("r", rSize)
					.style("fill", "rgba(255,255,255,0.4)");

				var mouthLeft = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.mouthLeft.x)
					.attr("cy", response[i].faceLandmarks.mouthLeft.y)
					.attr("r", rSize)
					.style("fill", "rgba(255,255,255,0.4)");

				var mouthRight = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.mouthRight.x)
					.attr("cy", response[i].faceLandmarks.mouthRight.y)
					.attr("r", rSize)
					.style("fill", "rgba(255,255,255,0.4)");

				var noseTip = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.noseTip.x)
					.attr("cy", response[i].faceLandmarks.noseTip.y)
					.attr("r", rSize)
					.style("fill", "rgba(255,255,255,0.4)");

				var underLipTop = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.underLipTop.x)
					.attr("cy", response[i].faceLandmarks.underLipTop.y)
					.attr("r", rSize)
					.style("fill", "rgba(255,255,255,0.4)");

			}

			var square = svg.append("rect")
				.attr("x", response[i].faceRectangle.left)
				.attr("y", response[i].faceRectangle.top)
				.attr("width", response[i].faceRectangle.width)
				.attr("height", response[i].faceRectangle.height)
				.attr("transform", "")
				.attr('fill', "none")
				.style("stroke-width", "3")
				.attr('stroke', '#fff');
		}


		var svgString = d3n.svgString()
		console.log(svgString);
		callback(svgString)
	}

	function getOrientation(filepath,callback) {
		try {
			new ExifImage({ image : filepath }, function (error, exifData) {
				if (error) {
					console.log('Error: '+error.message);
					callback(-2);
				}
				if (!error) {
					// req.file.Orientation = exifData.image.Orientation;
					callback(exifData.image.Orientation);
				}
			});
		} catch (error) {
			console.log('Error: ' + error.message);
			callback(-2);
		}
	}


	if (csrftoken !== req.headers["x-csrf-token"] || req.headers["content-length"] === undefined) {
		return res.json({})
	}

});
