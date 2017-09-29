
const path = require('path');
const fs = require('fs');
const jsonfile = require('jsonfile');


function api(app) {

	app.get("/" + process.env.DASHBOARD + "/data.json", function(req, res) {

		var apiDATA = {
			"emotion": [
				{
					"label": "anger",
					"value": 0
				},
				{
					"label": "fear",
					"value": 0
				},
				{
					"label": "happiness",
					"value": 0
				},
				{
					"label": "neutral",
					"value": 0
				},
				{
					"label": "sadness",
					"value": 0
				},
				{
					"label": "surprise",
					"value": 0
				}
			],
			"gender": [
				{
					"label": "man",
					"value": 0
				},
				{
					"label": "vrouw",
					"value": 0
				}
			],
			"age": [
				{
					"label": "Generation Z",
					"value": 0,
					"spec": "<15"
				},
				{
					"label": "Millennials",
					"value": 0,
					"spec": "15-30jr"
				},
				{
					"label": "Generation X",
					"value": 0,
					"spec": "30-55"
				},
				{
					"label": "Baby Boomers",
					"value": 0,
					"spec": "55-70"
				},
				{
					"label": "Silent Generation",
					"value": 0,
					"spec": "70-80"
				}
			],
			"averageage": {
				"value": 0,
				"count": 0
			},

			"eyeMakeup": [
				{
					"label": "No eye makeup",
					"value": 0
				},
				{
					"label": "Eye makeup",
					"value": 1
				}
			],
			"lipMakeup": [
				{
					"label": "No lib makeup",
					"value": 0
				},
				{
					"label": "lib makeup",
					"value": 1
				}
			],
			"glasses": [
				{
					"label": "ReadingGlasses",
					"value": 0
				},
				{
					"label": "NoGlasses",
					"value": 0
				},
				{
					"label": "SwimmingGoggles",
					"value": 0
				},
				{
					"label": "Sunglasses",
					"value": 0
				}
			],
			"moustache": [
				{
					"label": "No moustache",
					"value": 0
				},
				{
					"label": "moustache",
					"value": 0
				}
			],
			"sideburns": [
				{
					"label": "No sideburns",
					"value": 0
				},
				{
					"label": "sideburns",
					"value": 0
				}
			],
			"beard": [
				{
					"label": "No beard",
					"value": 0
				},
				{
					"label": "beard",
					"value": 0
				}
			],
			"hairColor": [
				{
					"label": "brown",
					"value": 0
				},
				{
					"label": "blond",
					"value": 0
				},
				{
					"label": "black",
					"value": 0
				},
				{
					"label": "other",
					"value": 0
				},
				{
					"label": "gray",
					"value": 0
				},
				{
					"label": "red",
					"value": 0
				}
			]
		}

		fs.readdir(path.join(__dirname,"..","uploads"), function(err, items) {
			for (var i=0; i<items.length; i++) {
				if (/.json/ig.test(items[i])) {
					var json = jsonfile.readFileSync( path.join(__dirname,"..","uploads",items[i]))
					tmpdata = returnval(json)
					apiDATA = merge(tmpdata,apiDATA)
				}
			}
			return res.json(apiDATA)
		});

	});

}


function merge(tmpdata,apiDATA) {

	Object.keys(apiDATA.gender).forEach(function(key) {
		apiDATA.gender[key].value += tmpdata.gender[key].value
	});

	Object.keys(apiDATA.emotion).forEach(function(key) {
		apiDATA.emotion[key].value += tmpdata.emotion[key].value
	});

	Object.keys(apiDATA.age).forEach(function(key) {
		apiDATA.age[key].value += tmpdata.age[key].value
	});

	Object.keys(apiDATA.lipMakeup).forEach(function(key) {
		apiDATA.lipMakeup[key].value += tmpdata.lipMakeup[key].value
	});

	Object.keys(apiDATA.eyeMakeup).forEach(function(key) {
		apiDATA.eyeMakeup[key].value += tmpdata.eyeMakeup[key].value
	});

	Object.keys(apiDATA.glasses).forEach(function(key) {
		apiDATA.glasses[key].value += tmpdata.glasses[key].value
	});

	Object.keys(apiDATA.moustache).forEach(function(key) {
		apiDATA.moustache[key].value += tmpdata.moustache[key].value
	});

	Object.keys(apiDATA.beard).forEach(function(key) {
		apiDATA.beard[key].value += tmpdata.beard[key].value
	});

	Object.keys(apiDATA.hairColor).forEach(function(key) {
		apiDATA.hairColor[key].value += tmpdata.hairColor[key].value
	});

	Object.keys(apiDATA.sideburns).forEach(function(key) {
		apiDATA.sideburns[key].value += tmpdata.sideburns[key].value
	});

	apiDATA.averageage.count += tmpdata.averageage.count
	apiDATA.averageage.value += tmpdata.averageage.value

	return apiDATA
}





module.exports = {
	api
}

function returnval(response) {

	var data = {
		"emotion": [
			{
				"label": "anger",
				"value": 0
			},
			{
				"label": "fear",
				"value": 0
			},
			{
				"label": "happiness",
				"value": 0
			},
			{
				"label": "neutral",
				"value": 0
			},
			{
				"label": "sadness",
				"value": 0
			},
			{
				"label": "surprise",
				"value": 0
			}
		],
		"gender": [
			{
				"label": "male",
				"value": 0
			},
			{
				"label": "female",
				"value": 0
			}
		],
		"age": [
			{
				"label": "Generation Z",
				"value": 0,
				"spec": "<15"
			},
			{
				"label": "Millennials",
				"value": 0,
				"spec": "15-30jr"
			},
			{
				"label": "Generation X",
				"value": 0,
				"spec": "30-55"
			},
			{
				"label": "Baby Boomers",
				"value": 0,
				"spec": "55-70"
			},
			{
				"label": "Silent Generation",
				"value": 0,
				"spec": "70-80"
			}
		],
		"averageage": {
			"value": 0,
			"count": 0
		},
		"eyeMakeup": [
			{
				"label": "No eye makeup",
				"value": 0
			},
			{
				"label": "Eye makeup",
				"value": 1
			}
		],
		"lipMakeup": [
			{
				"label": "No lib makeup",
				"value": 0
			},
			{
				"label": "lib makeup",
				"value": 0
			}
		],
		"glasses": [
			{
				"label": "ReadingGlasses",
				"value": 0
			},
			{
				"label": "NoGlasses",
				"value": 0
			},
			{
				"label": "SwimmingGoggles",
				"value": 0
			},
			{
				"label": "Sunglasses",
				"value": 0
			}
		],
		"moustache": [
			{
				"label": "No moustache",
				"value": 0
			},
			{
				"label": "moustache",
				"value": 0
			}
		],
		"beard": [
			{
				"label": "No beard",
				"value": 0
			},
			{
				"label": "beard",
				"value": 0
			}
		],
		"sideburns": [
			{
				"label": "No sideburns",
				"value": 0
			},
			{
				"label": "sideburns",
				"value": 0
			}
		],
		"hairColor": [
			{
				"label": "brown",
				"value": 0
			},
			{
				"label": "blond",
				"value": 0
			},
			{
				"label": "black",
				"value": 0
			},
			{
				"label": "other",
				"value": 0
			},
			{
				"label": "gray",
				"value": 0
			},
			{
				"label": "red",
				"value": 0
			}
		]



	}



	for (var i = 0; i < response.length; i++) {

		// Max emoiji
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

		var emotion = emotionType[index]

		Object.keys(data.emotion).forEach(function(key) {
    		// console.log(key, data.emotion[key]);
			if (data.emotion[key].label === emotion) {
				data.emotion[key].value += 1
			}
		});
		// end Max emoiji


		// add gender
		Object.keys(data.gender).forEach(function(key) {
			if (data.gender[key].label === response[i].faceAttributes.gender) {
				data.gender[key].value += 1
			}
		});

		// console.log(emotion);
		// console.log(response[i].faceAttributes.gender)
		// console.log(response[i].faceAttributes.age)

		// AGE!
		if (response[i].faceAttributes.age >= 0 && response[i].faceAttributes.age < 15) { //0
			data.age[0].value++
		}

		if (response[i].faceAttributes.age >= 15 && response[i].faceAttributes.age < 30) {
			data.age[1].value++
		}

		if (response[i].faceAttributes.age >= 30 && response[i].faceAttributes.age < 55) {  //30-55
			data.age[2].value++
		}

		if (response[i].faceAttributes.age >= 70 && response[i].faceAttributes.age < 80) {  //"70-80"
			data.age[3].value++
		}

		// response.length

		// averageage
		data.averageage.value += response[i].faceAttributes.age
		data.averageage.count++;

		console.log("data.averageage.value");
		console.log(data.averageage.value);

		// eye Makeup
		if (response[i].faceAttributes.makeup.eyeMakeup !== undefined) {
			if (response[i].faceAttributes.makeup.eyeMakeup) {
				data.eyeMakeup[0].value++
			}
			if (!response[i].faceAttributes.makeup.eyeMakeup) {
				data.eyeMakeup[1].value++
			}
		}

		// lipMakeup
		if (response[i].faceAttributes.makeup.lipMakeup !== undefined) {
			if (response[i].faceAttributes.makeup.lipMakeup) {
				data.lipMakeup[0].value++
			}
			if (!response[i].faceAttributes.makeup.lipMakeup) {
				data.lipMakeup[1].value++
			}
		}

		// glasses
		if (response[i].faceAttributes.glasses !== undefined) {

			// ReadingGlasses
			// NoGlasses
			// SwimmingGoggles
			// Sunglasses

			if (response[i].faceAttributes.glasses === "ReadingGlasses") {
				data.glasses[0].value++
			}
			if (response[i].faceAttributes.glasses === "NoGlasses") {
				data.glasses[1].value++
			}
			if (response[i].faceAttributes.glasses === "SwimmingGoggles") {
				data.glasses[2].value++
			}
			if (response[i].faceAttributes.glasses === "Sunglasses") {
				data.glasses[3].value++
			}

		}

		// moustache
		if (response[i].faceAttributes.facialHair.moustache !== undefined) {
			if (response[i].faceAttributes.facialHair.moustache < 0.5) {
				data.moustache[0].value++
			}
			if (response[i].faceAttributes.facialHair.moustache >= 0.5) {
				data.moustache[1].value++
			}
		}

		// sideburns
		if (response[i].faceAttributes.facialHair.sideburns !== undefined) {
			if (response[i].faceAttributes.facialHair.sideburns < 0.5) {
				data.sideburns[0].value++
			}
			if (response[i].faceAttributes.facialHair.sideburns >= 0.5) {
				data.sideburns[1].value++
			}
		}

		// beard
		if (response[i].faceAttributes.facialHair.beard !== undefined) {
			if (response[i].faceAttributes.facialHair.beard < 0.5) {
				data.beard[0].value++
			}
			if (response[i].faceAttributes.facialHair.beard >= 0.5) {
				data.beard[1].value++
			}
		}


		// HAIR
		var hairType = [];
		var hairScore = [];

		for (var j = 0; j < response[i].faceAttributes.hair.hairColor.length; j++) {
			hairType.push(response[i].faceAttributes.hair.hairColor[j].color)
			hairScore.push(response[i].faceAttributes.hair.hairColor[j].confidence)
		}
		var index = findIndexOfGreatest(hairScore);
		var hair = hairType[index]
		// console.log(hair);

		// "label": "brown",
		// "label": "blond",
		// "label": "black",
		// "label": "other",
		// "label": "gray",
		// "label": "red",

		if (hair === "brown") {
			data.hairColor[0].value++
		}
		if (hair === "blond") {
			data.hairColor[1].value++
		}
		if (hair === "black") {
			data.hairColor[2].value++
		}
		if (hair === "other") {
			data.hairColor[3].value++
		}
		if (hair === "gray") {
			data.hairColor[4].value++
		}
		if (hair === "red") {
			data.hairColor[5].value++
		}

	}
	// console.log(data);
	return data;
}
