
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

		// HAIR
		var hairType = [];
		var hairScore = [];

		for (var j = 0; j < response[i].faceAttributes.hair.hairColor.length; j++) {
			hairType.push(response[i].faceAttributes.hair.hairColor[j].color)
			hairScore.push(response[i].faceAttributes.hair.hairColor[j].confidence)
		}
		var index = findIndexOfGreatest(hairScore);
		var hair = hairType[index]

	}
	// console.log(data);
	return data;
}
