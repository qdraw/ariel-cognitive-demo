var express   =   require( 'express' );
var multer    =   require( 'multer' );
var upload    =   multer( { dest: 'uploads/' } );
var sizeOf    =   require( 'image-size' );
// var ejs    =   require( 'ejs' );
var request    =   require( 'request' );
var dotenv = require('dotenv').config();

const app = express()

// app.set('view engine', 'ejs');
app.use( express.static( __dirname + '/public' ) );

// app.get('/', function(req, res) {
//     res.render('index.ejs');
// });


app.post('/init', function(req, res) {

});


app.listen(process.env.PORT ||process.env.port || 5045, function () {
	console.log('> http://localhost:5045/')
})

app.post( '/upload', upload.single( 'file' ), function( req, res, next ) {

	if ( !req.file.mimetype.startsWith( 'image/' ) ) {
			return res.status( 422 ).json( {
				error : 'The uploaded file must be an image'
			}
		);
	}

	var dimensions = sizeOf( req.file.path );

	if ( ( dimensions.width < 640 ) || ( dimensions.height < 480 ) ) {
		return res.status( 422 ).json({
			error : 'The image must be at least 640 x 480px'
		});
	}
	console.log(req.file.path);

	// var ext = req.file.mimetype.split("/")
	// var ext = ext[ext.length-1];
	// fs.renameSync(req.file.path, req.file.path + "." + ext)
	// var exporturl = req.file.path + ".jpg";
	// var image = sharp(req.file.path + "." + ext);
	// image
	// 	.withMetadata()
	// 	.resize(1600,1600)
	// 	.max()
	// 	.rotate()
	// 	.jpeg()
	// 	.toFile(exporturl, function(err, info) {
	// 		if (err) {
	// 			console.error(err);
	// 			process.exit(1);
	// 			return;
	// 		}
	// 		console.log(req.file.path);
	// 		parseImage(req.file.path);
	// 		sendClassify(req.file.path);
	//
	// 	});

	return res.status( 200 ).send( req.file );
});
