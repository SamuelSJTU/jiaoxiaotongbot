// function getTime(entities){
// 	var times = new Array();
// 	for(var i in entities){
// 		var entity = entities[i];
// 		var val = entity['resolution']['values'] != undefined ? entity['resolution']['values'][0]: "";
// 		if(entity.type == 'builtin.datetimeV2.datetime') times.push(val); 
// 	}
// 	return times;
// }


// var la = require("./luis_api.js");
// la.askLuisIntent('计量经济学考试地点',function(data){
//     var entities = data.entities;

//     console.log(entities);
//     // console.log(getTime(entities));
// });
// var myio = require("./myIO");
// function getCalendarData(time,userName){
// 		var dataset = myio.readCanlendarData();
// 		var res = "";
// 		if(time == ""){
// 			for(var i in dataset){
// 				if(dataset[i][0]==userName){
// 					res+=dataset[i][3];
// 				}
// 			}
// 		}else{
// 			for(var i in dataset){
// 				if(dataset[i][0]==userName && dataset[i][1]==time){
// 					res+=dataset[i][3];
// 				}
// 			}
// 		}
// 		res = res=="" ? 'schedual not found' : res;
// 		return res;
// 	}

// console.log(getCalendarData("","xxx"));
// var mu = require("./myutils");
// var arr1 = [['xx','1',3],['yy',1,2]]
// console.log(mu.removeSmallEntity(arr1,arr1));
// var Q = "123456";
// console.log(Q.substring(3,Q.length))
// var myio = require("./myIO.js");
// function getStudyRoomList(date){
// 	var datas = myio.readStudyRoom();
// 	// console.log(datas);
// 	var roomlist = new Array();
// 	for(var i in datas){
// 		if((datas[i][1]==date) && datas[i][2]=="1") roomlist.push(datas[i][0]);
// 	}
// 	return roomlist;
// }
// console.log(getStudyRoomList("2017-08-15").indexOf('E211'))

// var path = require("path");
// var rf = require("fs");
// var data = rf.readFileSync(path.join(__dirname, './examData.txt'),"utf-8");
// var datas = data.split("\r\n");
// for(i in datas){
// 	if(i % 12 == 9 || i % 12 == 10 || i % 12 == 11 || i % 12 == 12){
// 		rf.appendFile(path.join(__dirname, './testexamData.txt'),datas[i]+'\r\n','utf8',function(err){  
// 		    if(err)  
// 		    {  
// 		        console.log(err);  
// 		    }  
// 		});
// 	}
// }
// var myio = require('./myIO.js');
// var data = myio.readNewData();
// console.log(data[14][3]);
// var cards = require('./cards');
// console.log(cards.isCard("cardCanteen"));


'use strict';

let https = require('https');

// **********************************************
// *** Update or verify the following values. ***
// **********************************************

// Replace the subscriptionKey string value with your valid subscription key.
let subscriptionKey = 'ac8c14fab4d24011824b45885e914f01';

// Verify the endpoint URI.  At this writing, only one endpoint is used for Bing
// search APIs.  In the future, regional endpoints may be available.  If you
// encounter unexpected authorization errors, double-check this host against
// the endpoint for your Bing Web search instance in your Azure dashboard.
let host = 'api.cognitive.microsoft.com';
let path = '/bing/v7.0/search';

let term = 'Microsoft Cognitive Services';

let response_handler = function (response) {
    let body = '';
    response.on('data', function (d) {
        body += d;
    });
    response.on('end', function () {
        console.log('\nRelevant Headers:\n');
        for (var header in response.headers)
            // header keys are lower-cased by Node.js
            if (header.startsWith("bingapis-") || header.startsWith("x-msedge-"))
                 console.log(header + ": " + response.headers[header]);
        body = JSON.stringify(JSON.parse(body), null, '  ');
        console.log('\nJSON Response:\n');
        console.log(body);
    });
    response.on('error', function (e) {
        console.log('Error: ' + e.message);
    });
};

let bing_web_search = function (search) {
  console.log('Searching the Web for: ' + term);
  let request_params = {
        method : 'GET',
        hostname : host,
        path : path + '?q=' + encodeURIComponent(search),
        headers : {
            'Ocp-Apim-Subscription-Key' : subscriptionKey,
        }
    };

    let req = https.request(request_params, response_handler);
    req.end();
}

if (subscriptionKey.length === 32) {
    bing_web_search(term);
} else {
    console.log('Invalid Bing Search API subscription key!');
    console.log('Please paste yours into the source code.');
}