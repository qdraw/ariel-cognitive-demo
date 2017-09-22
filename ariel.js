var express   =   require( 'express' );
var multer    =   require( 'multer' );

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/')
	},
	filename: function (req, file, cb) {
		console.log(file);
		cb(null, new Date().toISOString().slice(0,-5).replace(/[:-]/ig,"").replace(/T/ig,"_") + "_" +Math.floor( Math.random()*10000 ) )
	}
})

var upload = multer({ storage: storage })
var sizeOf    =   require( 'image-size' );
var jsonfile    =   require( 'jsonfile' );
var request    =   require( 'request' );
var dotenv = require('dotenv').config();
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
var ExifImage = require('exif').ExifImage;

const app = express();
var bodyParser = require('body-parser')

const crypto = require('crypto')
var csrftoken = crypto.randomBytes(48).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
var inittoken = undefined;

// you can remove and ignore this
if (process.env.DROPBOX_FOLDER !== undefined && process.env.DROPBOX_ACCESSTOKEN !== undefined) {
	console.log(">- sync enabled");
	var sync = require( './sync.js' );
}
if (process.env.DROPBOX_FOLDER === undefined || process.env.DROPBOX_ACCESSTOKEN === undefined) {
	var sync = {
		uploadFile: function() {
			return {}
		}
	}
}



// serve static content
var folder = process.env.folder || "public"
app.use(express.static( path.join(__dirname, folder)));

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Credentials", true).header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT").header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, cache-control, x-csrf-token, filename, Authorization, Bearer").header("Access-Control-Allow-Origin", "*")
	next();
});

fs.stat(path.join(__dirname, folder, "config.json"), function(err, stats) {

	if (err !== null) {
		var data = {};
		data.inittoken = "";
		data.server = "";
		jsonfile.writeFile(path.join(__dirname, folder, "config.json"), data, function (err) {
			console.error(err)
			console.log("please restart the app");
			process.exit(1);
		})
	}

	if (err === null) {
		jsonfile.readFile(path.join(__dirname, folder, "config.json"), function(err, data) {

			if (process.env.server === undefined) {
				console.error(">>>> please add server in .env");
				process.env.server = "http://localhost:5045/";
			}

			if (process.env.server !== undefined) {
				inittoken = new Buffer(process.env.server).toString('base64');
			}

			if (data.inittoken !== inittoken || data.server !== process.env.server) {
				data.inittoken = inittoken;
				data.server = process.env.server;
				console.log(data.inittoken,data.server);
				jsonfile.writeFile(path.join(__dirname, folder, "config.json"), data, function (err) {
					console.error(err)
				})
			}

		})
	}

});

app.get('/config', function(req, res) {
	// return res.sendFile(path.join(__dirname, folder, "config.json"));
	fs.stat(path.join(__dirname, folder, "config.json"), function(err, stats) {
		if (err !== null) {
			res.json({})
		}
		if (err === null) {
			jsonfile.readFile(path.join(__dirname, folder, "config.json"), function(err, data) {
				data.dynamic = true;
				res.json(data)
			})
		}

	});
});

if (process.env.DASHBOARD !== undefined) {
	var dashboardAPI = require('./dashboard/api.js');
	dashboardAPI.api(app)

	app.get("/" + process.env.DASHBOARD + "/", function(req, res) {
		if(req.url.substr(req.url.length-1) !== '/' && req.url.length > 1){
			res.redirect(301, req.url + "/")
		}
		if(req.url.substr(req.url.length-1) === '/' && req.url.length > 1){
			res.sendFile(path.join(__dirname,"dashboard","index.html"))
		}
	});
}



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

	}, 1);
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
							// console.log("curl 'http://localhost:5045/status' -H bearer:'" + req.headers.bearer + "' -H 'filename:" + req.headers.filename+"' -X POST");
							return res.json(obj);
						}
					})
				}
				if (Date.now() - stats.atimeMs >= 3001) {
					return res.json("timeout");
				}

			}
		});

	}
	if (csrftoken !== req.headers.bearer) {
		console.log("csrftoken !== req.headers.bearer");
		return res.json(false);
	}
});

app.set('port', process.env.PORT || process.env.port || 5045)
app.listen(app.get('port'), function () {
	console.log('> http://localhost:' + app.get('port'))
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
					 // sync module you can disable this
					 sync.uploadFile(req.file.path, process.env.DROPBOX_FOLDER + req.file.path.replace("uploads/","") + ".jpg")

					 parseImage(buffer,req.file.path);
					 getOrientation(req.file.path,function (Orientation) {
						 req.file.orientation = Orientation;
						 req.file.dimensions = sizeOf( buffer );
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
				if (response.length >= 0) {
					jsonfile.writeFile(path + ".json", response, function (err) {
						console.error(err)
						sync.uploadFile(path + ".json", process.env.DROPBOX_FOLDER + path.replace("uploads/","") + ".json");
					});
				}
			} catch (e) {}
		});
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
