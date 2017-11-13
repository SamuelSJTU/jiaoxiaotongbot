/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-waterfall
-----------------------------------------------------------------------------*/
"use strict";

var restify = require('restify');
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');
var TypeApi = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/0b51b9e7-2200-40c5-9a7d-d644b430364e?subscription-key=942cda48c103493883d488ed9dafe234&verbose=true&timezoneOffset=0&q=';
var fs = require('fs');
var myutils = require('./myutils.js');

var myutils2 = require('./myutils2.js');
console.log('begin');
var luis = require('./luis_api.js');
var fileoptions = {flag:'a'};
var cards = require('./cards.js');

var myio = require('./myIO.js');

var GAS = require('./getAnswerSync');
var QBH = require('./QB_api.js');

//var useEmulator = (process.env.NODE_ENV == 'development');
var useEmulator = true;
var connector = useEmulator ? new builder.ChatConnector() : new builder.ChatConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    // Setup Restify Server
    var server = restify.createServer();
    server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
    });
    // Listen for messages from users 
    server.post('/api/messages', connector.listen());
}


//var connector = new builder.ConsoleConnector().listen();  // 使用控制台进行测试
// var bot = new builder.UniversalBot(connector);
// bot.localePath(path.join(__dirname, './locale'));
// 将上一个问题的结果保存下来，对不同的conversionid进行存储
// 设置定时器，对每个conversionid加一个活跃度，每个一个小时加一，设置一个检查其活跃度的定时器，若10个小时不活跃，清除该用户上下午信息
// 可以对id进行处理，比如添加一些头，从而设置不同活跃度权重，默认以socketid作为conversionid

//var sl = require("./syncLuis.js");
var dataset = myio.readNewData();
var userInfo = new Array();
var ga = require("./getAnswer.js");

var bot = new builder.UniversalBot(connector,function(session){
    var userId = session.message.user.id;
    var question = session.message.text;
    if(question.indexOf('食堂')!=-1 || question.indexOf('餐厅')!=-1 || question.indexOf('餐饮')!=-1 || question.indexOf('吃')!=-1){
        var msg = cards.createCards["cardCanteen"](session); 
        session.send(msg);
        return;
    }else if(question.indexOf('校车')!=-1){
        var msg = cards.createCards["cardShuttle"](session); 
        session.send(msg);
        return;
    }else if(question.indexOf('巴士')!=-1){
        var msg = cards.createCards["cardBus"](session); 
        session.send(msg);
        return;
    }else if(question.indexOf('校歌')!=-1){
        var msg = cards.createCards["cardAnthem"](session); 
        session.send(msg);
        return;
    }else if(question.indexOf('你会')!=-1){
        var msg = cards.createCards["cardHelp"](session); 
        session.send(msg);
        return;
    }

    myio.write(question);
    if(userInfo[userId]==undefined) userInfo[userId] = new Array();
    var question_temp = question.split("#");
    userInfo[userId]['speakerName']='未知';
    if(question_temp.length>1){
        if(question_temp[1]!='未知'){
            userInfo[userId]['speakerName'] = question_temp[1];
        }
    }
    question = question_temp[0];
    var q_type = question.substring(0,4);
    // 仅仅用于测试
    if(q_type=='demo'){
        question = question.substring(4,question.length);
        QBH.askQnAMakerDemo(question,function(answers){
            var answer = answers[0].answer;
            if(userInfo[userId]['speakerName']!='未知'){
                answer = answer.replace('[人名]',userInfo[userId]['speakerName']);
            }else{
                answer = answer.replace('[人名]','');
            }


            if(answer=='No good match found in the KB')
            {
                 QBH.askBing(question,function(webPages){
                    var msg = cards.createCards["cardBing"](session,webPages); 
                    session.send(msg);
                 });
                return
            }
            console.log(answer)
             if(cards.isCard(answer)){
                    var msg = cards.createCards[answer](session); 
                    session.send(msg);
             }else if(answer=='From:上海交通大学闵行校区李政道图书馆;To:上海交通大学闵行校区软件学院'){
                session.send(answer);
                session.send('软件学院与李政道图书馆距离较远，建议乘坐校车！');
             }else if(answer=='我不知道'){
                 session.send(answer);
                 QBH.askBing(question,function(webPages){
                    var msg = cards.createCards["cardBing"](session,webPages); 
                    session.send(msg);
                 });
             }else{
                 session.send(answer);
             }
        });
        return;
    }



    if(ga.isHalfPhase(userInfo[userId]['PromptStatus'])){    //如果当前处于一半处问答
        var qentitiesold = userInfo[userId]['LastEntities'];
        var qrelation = userInfo[userId]['LastRelation'];
        var PromptStatus = userInfo[userId]['PromptStatus'];
        ga.getHalfAnswer(question,qentitiesold,qrelation,PromptStatus,
        function(answer){
            //问课程的回掉
            session.send(answer)
        },
        function(answer){
            //问考试的回掉
            session.send(answer)
        },
        function(answer){
            //问路程的回掉
            session.send(answer)
        },
        function(username){
            //Login的回调
            userInfo[userId]['PromptStatus'] = 'RegisterHalf';
            userInfo[userId]['Login'] = username;
            console.log('userName',username);
            session.send('Please input your pwd');
        },
        function(){
            //Register的回调
            session.send('你好: '+userInfo[userId]['Login']);
            userInfo[userId]['PromptStatus'] = 'Complete';
            // session.send('Your User Name is '+userInfo[userId]['Login']);
            if(userInfo[userId]['LastIntent']=='SearchCalendar'){
                var res = GAS.getCalendarData(userInfo[userId]['LastTimes'],userInfo[userId]['Login']);
                session.send(res);
            }else if(userInfo[userId]['LastIntent'] == 'AddCalendar'){
                GAS.addCalendarData(userInfo[userId]['LastTimes'],userInfo[userId]['Login'],userInfo[userId]['CalContent']);
                session.send('Add Calendar Success');
            }
        }
        );
        userInfo[userId]['PromptStatus'] = 'Complete';
        userInfo[userId]['LastRelation'] = '';
        userInfo[userId]['LastEntities'] = '';
    }else{
         ga.getAnswer(question,userInfo[userId]['LastQuestionEntity'],userInfo[userId]['LastEntity'],userInfo[userId]['LastRelation'],dataset,
            function(answer,qentities){
                //问Path的回掉
                if(answer == 'LackInfoPath'){

                    userInfo[userId]['PromptStatus'] = 'PathHalf';
                    userInfo[userId]['LastEntities'] = qentities;
                    session.send('请完善您的出发点目的地信息');
                }else{
                     session.send(answer);
                }
            },
            function(answer,qentities){
                // var answer = "cardShuttle";
                
                if(cards.isCard(answer)){
                    var msg = cards.createCards[answer](session);  // 返回card生成的msg
                    session.send(msg);
                }else if(answer == 'i dont know'){
                    QBH.askBing(question,function(webPages){
                        var msg = cards.createCards["cardBing"](session,webPages);
                        session.send(msg); 
                        //session.send(webPages[0].name);
                        //console.log('bing',webPages[0].name);
                    });                    
                }else{
                    session.send(answer);
                }
                userInfo[userId]['LastQuestionEntity'] = answer;
            },
            function(answer,qentities,qrelation){
                //AskLessonCallBack
                console.log(answer,qentities,qrelation);
                if(answer == 'LackInfoLesson'){
                    userInfo[userId]['PromptStatus'] = 'LessonHalf';
                    userInfo[userId]['LastEntities'] = qentities;
                    userInfo[userId]['LastRelation'] = qrelation;
                    session.send('缺少信息 需要任课教师和课程名');
                }else{
                    session.send(answer);
                }
            },
             function(answer,qentities,qrelation){
                //AskExamCallBack
                console.log(answer,qentities,qrelation);
                console.log('exam');
                if(answer == 'LackInfoExam'){
                    userInfo[userId]['PromptStatus'] = 'ExamHalf';
                    userInfo[userId]['LastEntities'] = qentities;
                    userInfo[userId]['LastRelation'] = qrelation;
                    session.send('缺少考试信息 需要任课教师和课程名');
                }else{
                    session.send(answer);
                }
            },
            function(answer){
                //AskQnaMaker                
                if(answer=='No good match found in the KB')
                {
                    QBH.askBing(question,function(webPages){
                        var msg = cards.createCards["cardBing"](session,webPages); 
                        session.send(msg);
                    });
                    return
                }else{

                    session.send(answer);
                }
            },
            function(){
                //Login
                userInfo[userId]['PromptStatus'] = 'LoginHalf';
                session.send('请输入用户名哦~');
            },
            function(){
                //Logout
                userInfo[userId]['Login'] = undefined;
                session.send('退出成功');
            },
            function(times){
                //SearchCalen
                if(userInfo[userId]['Login'] == undefined){
                    session.send('请先登录并输入您的用户名哦');
                    userInfo[userId]['PromptStatus'] = 'LoginHalf';
                    userInfo[userId]['LastIntent'] = 'SearchCalendar';
                }else{
                    var res = GAS.getCalendarData(times,userInfo[userId]['Login']);
                    userInfo[userId]['LastTimes'] = times;
                    session.send(res);
                }
            },
            function(times,content){
                //AddCalen
                if(userInfo[userId]['Login'] == undefined){
                    session.send('请先登录并输入您的用户名哦');
                    userInfo[userId]['PromptStatus'] = 'LoginHalf';
                    userInfo[userId]['LastIntent'] = 'AddCalendar';
                    userInfo[userId]['CalContent'] = content;
                    userInfo[userId]['LastTimes'] = times;
                    console.log(times);
                }else{
                    GAS.addCalendarData(times,userInfo[userId]['Login'],content);
                    session.send('添加行程成功');
                }
            },
            function(res){
                //查看小组自习室
                session.send(res);
            },
            function(res){
                //预约小组自习室
                if(userInfo[userId]['Login'] == undefined){
                    session.send('请先登录并输入您的用户名哦');
                    userInfo[userId]['PromptStatus'] = 'LoginHalf';
                }else{
                    session.send(res);
                }
            },
            function(ans){
                //BingCallBack
                session.send('我们推荐来自Bing的结果'+ans);
            }
        );
    }
});