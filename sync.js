var path = require('path');
var fs = require('fs');

require('dotenv').config({path: path.join(__dirname,"..",".env")});
const request = require('request');


function uploadFile(inputPath,outputPath) {

	if (process.env.DROPBOX_ACCESSTOKEN !== undefined) {
		fs.access(inputPath, fs.constants.R_OK | fs.constants.W_OK, (err) => {
			if (err === null) {
				run()
			}
			if (err !== null) {
				console.log(err);
			}
		});
	}

	function run() {
		var formquery = fs.createReadStream(inputPath);
		var contentLength = formquery.lenght;

		outputPath = outputPath.replace(path.win32.sep,path.posix.sep)
		APIArg = JSON.stringify({"path": outputPath})
		console.log(APIArg);

		request({
			headers: {
				'Authorization': 'Bearer ' + process.env.DROPBOX_ACCESSTOKEN,
				'Content-Length': contentLength,
				'Dropbox-API-Arg': APIArg,
				'Content-Type': "application/octet-stream"
			},
			uri: 'https://content.dropboxapi.com/2/files/upload',
			body: formquery,
			method: 'POST',
			encoding: 'binary'
		}, function (err, res,body) {
			if (err === null) {
				console.log(body);
			}
		});

	}
}


module.exports = {
	uploadFile
}
