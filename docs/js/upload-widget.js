
Dropzone.autoDiscover = false;

document.addEventListener("DOMContentLoaded", function(event){

	getConfig();

	if (document.querySelectorAll("#upload-widget").length >= 1) {
		document.querySelector("#upload-widget").style.display = "none";
	}

	var dimensions = [];

	function getConfig() {

		var xhr = new XMLHttpRequest();
		xhr.open('GET', "config.json", true);
		xhr.onload = function () {
			if (xhr.status === 200 || xhr.status === 304) {
				try {
					data = JSON.parse(xhr.responseText);
				} catch (e) {
					data = undefined;
				}

				if (data !== undefined) {
					getBackendServer(data.server + "init" ,data.inittoken);
					computersaysno();
					document.querySelector("#upload-widget").action = data.server + "upload";
				}

			}
		};
		xhr.send(null);
	}

	var isBackendServerReady = false;
	function getBackendServer(server,inittoken) {
		console.log(server);
		var xhr = new XMLHttpRequest();
		xhr.open('POST', server, true);
		xhr.setRequestHeader("bearer", inittoken);

		xhr.onload = function () {
			if (JSON.parse(xhr.responseText).length === 64) {
				isBackendServerReady = true;
				document.querySelectorAll('meta[name=csrf-token]')[0].getAttributeNode('content').value = JSON.parse(xhr.responseText);
				uploadWidget();
				startuploading();
			}
		};
		xhr.send(null);
	}

	function computersaysno() {
		document.querySelector("#welcome").innerHTML = "The computer says wait";
		document.querySelector("#info").innerHTML = "Please wait a few seconds, I'm now booting my Raspberry Pi. When this is done you can test your emotion and check how old you are. ";
		loaderHelper(1234,"img/loader1.gif");
		loaderHelper(2000,"img/loader2.gif");
		loaderHelper(6000,"img/loader3.gif");
		loaderHelper(10000,"img/loader2.gif");
	}

	function loaderHelper(time,url) {
		setTimeout(function(){
			if (!isBackendServerReady) {
				document.querySelector("#loader").style.display = "block";
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url, true);
				xhr.onload = function () {
					document.querySelector("#loader").style.backgroundImage =  "url('" + url +"')"
				}
				xhr.send(null);
			}

		}, time);
	}

	function startuploading() {
		if (document.querySelectorAll("#upload-widget").length >= 1) {
			document.querySelector("#upload-widget").style.display = "block";
		}
		document.querySelector("#loader").style.display = "none";
		document.querySelector("#welcome").innerHTML = "Add your photo here";
		document.querySelector("#info").innerHTML = "Just by analysing this picture we can say a lot about you. Test your emotion, check how old you are. ";

	}

	function uploadWidget() {

		var uploader = new Dropzone('#upload-widget', {
			paramName: 'file',
			maxFilesize: 3, // MB
			maxFiles: 1,
			thumbnailWidth: 1000,
			thumbnailHeight: null,
			dictDefaultMessage: 'Click or drag an image to start',
			headers: {
				'x-csrf-token': document.querySelectorAll('meta[name=csrf-token]')[0].getAttributeNode('content').value,
			},
			acceptedFiles: 'image/jpeg',
			accept: function(file, done) {
				file.acceptDimensions = done;
				file.rejectDimensions = function() {
					done('The image must be at least 640 x 480px')
				};
			}
		});
		uploader.on('addedfile', function( file){

			document.querySelector("#welcome").innerHTML = "We are sending it to us";
			document.querySelector("#info").innerHTML = "";

			console.log(file);
			// start upload
		});

		// uploader.on("sending", function(file, xhr, formData) {
		// 	// formData.append("bearer", file.height);
		// 	// formData.append("width", file.width);
		// });

		uploader.on('thumbnail', function(file, dataUrl) {
			// console.log(dataUrl);
			if ( file.width < 640 || file.height < 480 ) {
				file.rejectDimensions();
			}
			if ( file.width >= 640 || file.height >= 480 ) {
				file.acceptDimensions();
			}
		});

		uploader.on('success', function( file, resp ){

			dimensions = resp.dimensions;

			waitForCognitive(resp.filename);

			document.querySelector(".dz-success-mark").style.display = "none";

			rotateImage(document.querySelector(".dz-image > img:nth-child(1)").src, resp.orientation, function (base64) {
				document.querySelector(".dz-image > img:nth-child(1)").src = base64;
				initD3();
			});

			document.querySelector("#welcome").innerHTML = "Get ready!";

		});
	}

	function waitForCognitive(hash) {
		var intervalForCognitive = setInterval(function(){
			var xhr = new XMLHttpRequest();
			xhr.open('POST', document.querySelector("#upload-widget").action.replace("upload","status"), true);
			xhr.setRequestHeader("bearer", document.querySelectorAll('meta[name=csrf-token]')[0].getAttributeNode('content').value);
			xhr.setRequestHeader("filename", hash);
			xhr.onload = function () {

				if (xhr.responseText !== "false") {
					clearInterval(intervalForCognitive);

					try {
						response = JSON.parse(xhr.responseText)
					} catch (e) {
						response = "false"
					}

					if (response !== "false") {
						showData(response);
						showText(response);
						showHeader(response);
					}
				}
			};
			xhr.send(null);

		}, 1234);
	}

	function rotateImage(srcBase64, srcOrientation, callback) {
		var img = new Image();

  		img.onload = function() {
			var width = img.width,
			height = img.height,
			canvas = document.createElement('canvas'),
			ctx = canvas.getContext("2d");

			// set proper canvas dimensions before transform & export
			if (4 < srcOrientation && srcOrientation < 9) {
				canvas.width = height;
				canvas.height = width;
			} else {
				canvas.width = width;
				canvas.height = height;
			}

			// transform context before drawing image
			switch (srcOrientation) {
				case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
				case 3: ctx.transform(-1, 0, 0, -1, width, height ); break;
				case 4: ctx.transform(1, 0, 0, -1, 0, height ); break;
				case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
				case 6: ctx.transform(0, 1, -1, 0, height , 0); break;
				case 7: ctx.transform(0, -1, -1, 0, height , width); break;
				case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
				default: break;
			}

			// draw image
			ctx.drawImage(img, 0, 0);

			// export base64
			callback(canvas.toDataURL());
		};

		img.src = srcBase64;
	}


	// // // // TEST
	// var div = document.createElement('div')
	// div.className = "dz-preview dz-processing dz-image-preview dz-success dz-complete";
	// div.innerHTML = '<div class="dz-image"><img data-dz-thumbnail="" alt="2017-08-17 10.38.37.jpg" src="index.png"></div>  <div class="dz-details">    <div class="dz-size"><span data-dz-size=""><strong>0.3</strong> MB</span></div>    <div class="dz-filename"><span data-dz-name="">2017-08-17 10.38.37.jpg</span></div>  </div>  <div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress="" style="width: 100%;"></span></div>  <div class="dz-error-message"><span data-dz-errormessage=""></span></div>  <div class="dz-success-mark" style="display: none;"> </div>'
	// document.querySelector('#upload-widget').appendChild(div);
	// var dimensions = {height: 1800, width: 1350, type: "jpg" }
	// document.querySelector("#upload-widget").style.height = "0px";
	//
	// initD3();
	// setTimeout(function(){
	// 	var response =  [{"faceId":"91cbde9a-58ba-4093-b908-baa4b020d465","faceRectangle":{"top":703,"left":431,"width":549,"height":549},"faceLandmarks":{"pupilLeft":{"x":582.3,"y":852.8},"pupilRight":{"x":838.5,"y":863.7},"noseTip":{"x":702.7,"y":992.1},"mouthLeft":{"x":585.1,"y":1093.7},"mouthRight":{"x":816.4,"y":1112.7},"eyebrowLeftOuter":{"x":480.5,"y":795},"eyebrowLeftInner":{"x":658,"y":799.2},"eyeLeftOuter":{"x":541.7,"y":850.5},"eyeLeftTop":{"x":575.4,"y":837.4},"eyeLeftBottom":{"x":574.9,"y":866},"eyeLeftInner":{"x":619,"y":854.2},"eyebrowRightInner":{"x":769.9,"y":801.1},"eyebrowRightOuter":{"x":928,"y":820.2},"eyeRightInner":{"x":790.7,"y":864.2},"eyeRightTop":{"x":834,"y":848.9},"eyeRightBottom":{"x":832.2,"y":875.4},"eyeRightOuter":{"x":873.7,"y":866.9},"noseRootLeft":{"x":677.5,"y":854.8},"noseRootRight":{"x":742.1,"y":856.8},"noseLeftAlarTop":{"x":643.2,"y":941.7},"noseRightAlarTop":{"x":764.2,"y":941.2},"noseLeftAlarOutTip":{"x":621.8,"y":986.7},"noseRightAlarOutTip":{"x":784,"y":992.3},"upperLipTop":{"x":697.4,"y":1071.3},"upperLipBottom":{"x":698.2,"y":1092.1},"underLipTop":{"x":697,"y":1128},"underLipBottom":{"x":693.9,"y":1157.5}},"faceAttributes":{"smile":0.111,"headPose":{"pitch":0,"roll":2.4,"yaw":1.4},"gender":"male","age":26.1,"facialHair":{"moustache":0.1,"beard":0.2,"sideburns":0},"glasses":"ReadingGlasses","emotion":{"anger":0,"contempt":0,"disgust":0,"fear":0,"happiness":0.111,"neutral":0.766,"sadness":0.123,"surprise":0},"makeup":{"eyeMakeup":false,"lipMakeup":true},"hair":{"bald":0.01,"invisible":false,"hairColor":[{"color":"brown","confidence":1},{"color":"black","confidence":0.8},{"color":"other","confidence":0.28},{"color":"red","confidence":0.13},{"color":"gray","confidence":0.1},{"color":"blond","confidence":0.03}]}}}]
	//
	// 	showData(response);
	// showHeader(response);
	// showText(response)
	// }, 2000);
	// // end TESTUNG



	function initD3() {
		moveUploader();
		function moveUploader() {
			document.querySelector("#upload-widget").style.display = "none";
			var img = document.createElement('img')
			img.src = document.querySelector(".dz-image > img:nth-child(1)").src
			document.querySelector('#image').appendChild(img);
			document.querySelector("#image").style.display = "block";
		}

		// Start D3
		var svg = d3.select("#image").append("svg")
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("viewBox", "0 0 " + dimensions.width + " " + dimensions.height);

			var points = [
				"pupilLeft",
				"pupilRight",
				"mouthLeft",
				"mouthRight",
				"noseTip",
				"underLipTop",
			]


			for (var i = 0; i < points.length; i++) {
				var circle = svg.append("circle")
					.transition()
					.attr("id", points[i])
					.attr("cx", Math.random() * dimensions.width)
					.attr("cy", Math.random() * dimensions.height)
					.attr("r", "30")
					.style("fill", "rgba(255,255,255,0.8)")
					.on("end", function (d,i) {
						moveElementsThoughScreen(this.id)
					});
			}

			function moveElementsThoughScreen(id) {
			    d3.select("#" + id).transition().duration(500)
			        .attr("cx", Math.random() * dimensions.width) // change this to random 2px
			    	.attr("cy", Math.random() * dimensions.height) // change this to random 2px
					.attr("r", (Math.random() * 30) + 10)
					.on("end", function (d) {
						moveElementsThoughScreen(this.id)
					});
			}//e/my

			var square = svg.append("rect")
				.transition()
				.attr("id", "facerect")
				.attr("x", (Math.random() * dimensions.width) )
				.attr("y", (Math.random() * dimensions.width))
				.attr("width", (Math.random() * dimensions.width))
				.attr("height", (Math.random() * dimensions.width) )
				.attr('fill', "none")
				.style("stroke-width", ((Math.random() * 30) + 2) )
				.attr('stroke', '#fff')
				.on("end", function (d) {
					moveRectThoughScreen(this.id)
				});

				function moveRectThoughScreen(id) {
				    d3.select("#" + id).transition().duration(500)
						.attr("x", (Math.random() * dimensions.width) )
						.attr("y", (Math.random() * dimensions.width))
						.attr("width", (Math.random() * dimensions.width))
						.attr("height", (Math.random() * dimensions.width) )
						.style("stroke-width", ((Math.random() * 30) + 2) )
						.on("end", function (d) {
							moveRectThoughScreen(this.id)
						});
				}//e/my


	}



	function showData(response) {

		var points = [
			"pupilLeft",
			"pupilRight",
			"mouthLeft",
			"mouthRight",
			"noseTip",
			"underLipTop",
		]


		if (response.length === 0) {

			for (var j = 0; j < points.length; j++) {
				d3.select("#" + points[j]).transition().duration(500)
					.attr("r", 0)
			}
			d3.select("#facerect").transition().duration(500)
				.style("stroke-width", 0)

		}


		if (response.length >= 1) {

			var svg = d3.select("#image svg");


			var rSize = Number(response[0].faceLandmarks.eyeRightOuter.x - response[0].faceLandmarks.eyeRightBottom.x)/4;
			if (rSize <= 3) rSize = 3;

			for (var j = 0; j < points.length; j++) {

				d3.select("#" + points[j]).transition().duration(500)
					.attr("r", rSize)
					.style("fill", "rgba(255,255,255,0.8)")
					.attr("cx", function (d) {
						return response[0].faceLandmarks[this.id].x
					})
					.attr("cy", function (d) {
						return response[0].faceLandmarks[this.id].y
					});
			}

			d3.select("#facerect").transition().duration(500)
				.attr("x", response[0].faceRectangle.left)
				.attr("y", response[0].faceRectangle.top)
				.attr("width", response[0].faceRectangle.width)
				.attr("height", response[0].faceRectangle.height)
				.attr('fill', "none")
				.style("stroke-width", rSize)
				.attr('stroke', '#fff');

		}


		if (response.length >= 2) {

			for (var i = 1; i < response.length; i++) {

				var rSize = Number(response[i].faceLandmarks.eyeRightOuter.x - response[i].faceLandmarks.eyeRightBottom.x)/4;
				if (rSize <= 3) rSize = 3;

				var pupilLeft = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.pupilLeft.x)
					.attr("cy", response[i].faceLandmarks.pupilLeft.y)
					.attr("r", rSize)
					.attr("class", "pupilLeft")
					.style("fill", "rgba(255,255,255,0.4)");

				var pupilRight = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.pupilRight.x)
					.attr("cy", response[i].faceLandmarks.pupilRight.y)
					.attr("r", rSize)
					.attr("class", "pupilRight")
					.style("fill", "rgba(255,255,255,0.4)");

				var mouthLeft = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.mouthLeft.x)
					.attr("cy", response[i].faceLandmarks.mouthLeft.y)
					.attr("r", rSize)
					.attr("class", "mouthLeft")
					.style("fill", "rgba(255,255,255,0.4)");

				var mouthRight = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.mouthRight.x)
					.attr("cy", response[i].faceLandmarks.mouthRight.y)
					.attr("r", rSize)
					.attr("class", "mouthRight")
					.style("fill", "rgba(255,255,255,0.4)");

				var noseTip = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.noseTip.x)
					.attr("cy", response[i].faceLandmarks.noseTip.y)
					.attr("r", rSize)
					.attr("class", "noseTip")
					.style("fill", "rgba(255,255,255,0.4)");

				var underLipTop = svg.append("circle")
					.attr("cx", response[i].faceLandmarks.underLipTop.x)
					.attr("cy", response[i].faceLandmarks.underLipTop.y)
					.attr("r", rSize)
					.attr("class", "underLipTop")
					.style("fill", "rgba(255,255,255,0.7)");

				var square = svg.append("rect")
					.attr("x", response[i].faceRectangle.left)
					.attr("y", response[i].faceRectangle.top)
					.attr("width", response[i].faceRectangle.width)
					.attr("height", response[i].faceRectangle.height)
					.attr('fill', "none")
					.style("stroke-width", rSize)
					.attr('stroke', '#fff');

			}
			for (var i = 0; i < response.length; i++) {
				var person = "(" + Number(i+1) + ") ";
				var gendertext =  response[i].faceAttributes.gender + ", ";
				var agetext = "age: " + Math.round(response[i].faceAttributes.age) + "; ";

				var text = svg.append("text")
					.attr("x", response[i].faceRectangle.left)
					.attr("y", response[i].faceRectangle.top + response[i].faceRectangle.height  + 25)
					.style("fill", "white")
					.style("font-size", "20px")
					.attr("dy", ".35em")
					.attr("text-anchor", "left")
					.text(person + gendertext + agetext);
			}
		}

	}
	function showHeader(response) {
		if (response.length === 0) {
			document.querySelector("#welcome").innerHTML = "No one here?";
		}
		if (response.length === 1) {
			document.querySelector("#welcome").innerHTML = "Your are " + Math.round(response[0].faceAttributes.age) + " and " + maxEmoji(response)[0];
		}
		if (response.length >= 2) {
			document.querySelector("#welcome").innerHTML = "You are " +  mode(maxEmoji(response));
		}

	}

	function showText(response) {
		document.querySelector("#emotion").innerHTML = "<h3>Emotion</h3><ul></ul>"
		if (response !== undefined) {
			var maxEmojiList = maxEmoji(response);

			for (var i = 0; i < response.length; i++) {
				document.querySelector("#emotion ul").innerHTML += "<li style='list-style-type:none;'><h3 id='person_"+ response[i].faceId + "'> Person (" + Number(i+1) + ") </h3></li>"

				document.querySelector("#emotion ul").innerHTML += "<li> age: " +response[i].faceAttributes.age + "</li>"
				document.querySelector("#emotion ul").innerHTML += "<li> gender: " +response[i].faceAttributes.gender + "</li>"

				document.querySelector("#emotion ul").innerHTML += "<li> glasses: " +response[i].faceAttributes.glasses + "</li>"

				document.querySelector("#emotion ul").innerHTML += "<li> emotion: " + maxEmojiList[i] +"</li>";

				var emotionContent = "<li> emotion scores:" + "<br />";

				if (response[i].faceAttributes.emotion.anger >= 0.25) {
					emotionContent += " anger: " + response[i].faceAttributes.emotion.anger;
				}
				if (response[i].faceAttributes.emotion.contempt >= 0.25) {
					emotionContent += " contempt: "  + response[i].faceAttributes.emotion.contempt;
				}
				if (response[i].faceAttributes.emotion.disgust >= 0.25) {
					emotionContent += " disgust: " +  response[i].faceAttributes.emotion.disgust;
				}
				if (response[i].faceAttributes.emotion.fear >= 0.25) {
					emotionContent += " fear: "  + response[i].faceAttributes.emotion.fear;
				}
				if (response[i].faceAttributes.emotion.happiness >= 0.25) {
					emotionContent += " happiness: " +  response[i].faceAttributes.emotion.happiness;
				}

				emotionContent += " neutral: " +  response[i].faceAttributes.emotion.neutral;

				if (response[i].faceAttributes.emotion.sadness >= 0.25) {
					emotionContent += " sadness: "  + response[i].faceAttributes.emotion.sadness;
				}
				if (response[i].faceAttributes.emotion.surprise >= 0.25) {
					emotionContent += " surprise: "  + response[i].faceAttributes.emotion.surprise;
				}
				emotionContent += "</li>";

				document.querySelector("#emotion ul").innerHTML += emotionContent;

				document.querySelector("#emotion ul").innerHTML += "<li> makeup: eyeMakeup: " + response[i].faceAttributes.makeup.eyeMakeup + " lipMakeup: " + response[i].faceAttributes.makeup.lipMakeup + "</li>"

				if (response[i].faceAttributes.accessories !== undefined) {
					document.querySelector("#emotion ul").innerHTML += "<li> accessories: " +JSON.stringify(response[i].faceAttributes.accessories) + "</li>"
				}
				if (response[i].faceAttributes.exposure !== undefined) {
					document.querySelector("#emotion ul").innerHTML += "<li> exposure: " +  response[i].faceAttributes.exposure.exposureLevel + ' ' +  response[i].faceAttributes.exposure.value +"</li>";
				}
				if (response[i].faceAttributes.occlusion !== undefined) {
					document.querySelector("#emotion ul").innerHTML += "<li> foreheadOccluded: " +  response[i].faceAttributes.occlusion.foreheadOccluded + " eyeOccluded: " + response[i].faceAttributes.occlusion.eyeOccluded + " mouthOccluded: " + response[i].faceAttributes.occlusion.mouthOccluded +"</li>";
				}
				document.querySelector("#emotion ul").innerHTML += "<li> moustache: " +  response[i].faceAttributes.facialHair.moustache +   " beard: " +  response[i].faceAttributes.facialHair.beard +   " sideburns: " +  response[i].faceAttributes.facialHair.sideburns + "</li>";

			}
		}
	}

	function mode(arr){
	    return arr.sort((a,b) =>
	          arr.filter(v => v===a).length
	        - arr.filter(v => v===b).length
	    ).pop();
	}

	function maxEmoji(response) {
		var values = [];
		for (var i = 0; i < response.length; i++) {
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
			values.push(emotionType[index])
		}
		return values;
	}



});
