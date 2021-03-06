/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

//body-parser is used to parse the POST requests from clients that give the server their boards
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json 
app.use(bodyParser.json())

var ibmdb = require('ibm_db');

/*
ibmdb.open("DRIVER={DB2};DATABASE=SQLDB;HOSTNAME=75.126.155.153;UID=user17653;PWD=tjVBuwXpyqa5;PORT=50000;PROTOCOL=TCPIP", function (err,conn) {
	if (err) return console.log("Error opening db");
    console.log("Successfully opened db");
    
    var result = conn.querySync("DELETE * FROM CLASSICSCORES");
    var result2 = conn.querySync("DELETE * FROM RECOVERYSCORES");
    var result3 = conn.querySync("DELETE * FROM YOWESCORES");
    var result4 = conn.querySync("DELETE * FROM VERSUSSCORES");
    var result5 = conn.querySync("DELETE * FROM RECOVERYTABLES");
 
    conn.commitTransactionSync();
     
    conn.closeSync();
});
*/

//router to handle requests for getting/setting the last board in recovery mode
var recoveryBoardRouter = express.Router();
recoveryBoardRouter.use(function(req, res, next) {
	next();
});


var highscoreRouter = express.Router();
highscoreRouter.use(function(req, res, next) {
	next();
});



//temporarily saving board as a variable instead of in database
var board = [];
var score = 0;

//when the route is '/recovery/board' and type of request is 'get'
recoveryBoardRouter.get('/', function(req, res) {
	//if board is empty, send and empty board
    
    //query boards table
    ibmdb.open("DRIVER={DB2};DATABASE=SQLDB;HOSTNAME=75.126.155.153;UID=user17653;PWD=tjVBuwXpyqa5;PORT=50000;PROTOCOL=TCPIP", function (err,conn) {
        if (err) return console.log("Error opening db");
        //console.log("Successfully opened db");
    
        var query = conn.querySync("select * from RECOVERYTABLES");
        console.log("Sending: ");
        console.log(query);
        var data = { 'data': query };
        console.log(data);
        res.json(data);
        
        conn.closeSync();
    });   
/*
	if (board.length == 0) {
		res.json({'board': [[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]
], 'score':0});
	} else {
		//otherwise send the board that was saved and null out the board
		res.json({'board': board, 'score':score});
		board = [];
		score = 0;
	}
*/
});


highscoreRouter.get('/', function(req, res) {

    ibmdb.open("DRIVER={DB2};DATABASE=SQLDB;HOSTNAME=75.126.155.153;UID=user17653;PWD=tjVBuwXpyqa5;PORT=50000;PROTOCOL=TCPIP", function (err,conn) {
        if (err) return console.log("Error opening db");
        //console.log("Successfully opened db");
        
        var recoveryScores = conn.querySync("select * from RECOVERYSCORES");
        recoveryScores.sort(function(a,b) {
            if (a.SCORE > b.SCORE)
                return -1;
            else if (a.SCORE < b.SCORE)
                return 1;
            return 0;
        });
        var yoweScores = conn.querySync("select * from YOWESCORES");
        yoweScores.sort(function(a,b) {
            if (a.SCORE > b.SCORE)
                return -1;
            else if (a.SCORE < b.SCORE)
                return 1;
            return 0;
        });
        var classicScores = conn.querySync("select * from CLASSICSCORES");
        classicScores.sort(function(a,b) {
            if (a.SCORE > b.SCORE)
                return -1;
            else if (a.SCORE < b.SCORE)
                return 1;
            return 0;
        });
        res.json({
            'recoveryScores' : recoveryScores.slice(0, 10),
            'yoweScores' : yoweScores.slice(0, 10),
            'classicScores' : classicScores.slice(0, 10)            
        });
        
        conn.closeSync();
    });
});

highscoreRouter.post('/recovery', function(req, res) {
    
    console.log(req.body);
    
    if (!req.body.username) {
        res.send({"status": "error", "message": "missing a username"});
    }
    
    var score = req.body.score;
    var username = req.body.username;
    if (username.length == 0)
        return;
    
    ibmdb.open("DRIVER={DB2};DATABASE=SQLDB;HOSTNAME=75.126.155.153;UID=user17653;PWD=tjVBuwXpyqa5;PORT=50000;PROTOCOL=TCPIP", function (err,conn) {
        if (err) return console.log("Error opening db");
        //console.log("Successfully opened db");
        var stmt = conn.prepareSync("insert into RECOVERYSCORES (NAME, SCORE) values (?, ?)");
        stmt.execute([username, score], function(err, result) {
                if (err) {
                    //console.log("Error inserting to db");
                    conn.closeSync();
                    return;
                }
                result.closeSync();
                conn.closeSync();
            });
    });

});

highscoreRouter.post('/classic', function(req, res) {

    if (!req.body.username) {
        res.send({"status": "error", "message": "missing a username"});
    }
    
    var score = req.body.score;
    var username = req.body.username;
    if (username.length == 0)
        return;
    
    ibmdb.open("DRIVER={DB2};DATABASE=SQLDB;HOSTNAME=75.126.155.153;UID=user17653;PWD=tjVBuwXpyqa5;PORT=50000;PROTOCOL=TCPIP", function (err,conn) {
        if (err) return console.log("Error opening db");
        //console.log("Successfully opened db");
        var stmt = conn.prepareSync("insert into CLASSICSCORES (NAME, SCORE) values (?, ?)");
        stmt.execute([username, score], function(err, result) {
            if (err) {
                //console.log("Error inserting to db");
                conn.closeSync();
                return;
            }
            result.closeSync();
            conn.closeSync();
        });
    });


});

highscoreRouter.post('/enemy', function(req, res) {


    if (!req.body.username) {
        res.send({"status": "error", "message": "missing a username"});
    }
    
    var score = req.body.score;
    var username = req.body.username;
    if (username.length == 0)
        return;
    
    ibmdb.open("DRIVER={DB2};DATABASE=SQLDB;HOSTNAME=75.126.155.153;UID=user17653;PWD=tjVBuwXpyqa5;PORT=50000;PROTOCOL=TCPIP", function (err,conn) {
        if (err) return console.log("Error opening db");
        //console.log("Successfully opened db");
        var stmt = conn.prepareSync("insert into YOWESCORES (NAME, SCORE) values (?, ?)");
        stmt.execute([username, score], function(err, result) {
                if (err) {
                    //console.log("Error inserting to db");
                    conn.closeSync();
                    return;
                }
                result.closeSync();
                conn.closeSync();
            });
    });


});

recoveryBoardRouter.post('/', function(req, res) {
	//console.log(req);

	if (!req.body.board) {
		res.send({"status": "error", "message": "missing a board"});
	} else {
        
        
        var board = req.body.board;
        var ROW_LENGTH = 15;
        var ROW_COUNT = 3;
        for (var i = 0; i < 15; i++) {
            for (var j = 0; j < 12; j++) {
                if (j < (15-3))
                    continue;
                board[i * 15 + j] = '9';
            }
        }
        ibmdb.open("DRIVER={DB2};DATABASE=SQLDB;HOSTNAME=75.126.155.153;UID=user17653;PWD=tjVBuwXpyqa5;PORT=50000;PROTOCOL=TCPIP", function (err,conn) {
            if (err) return console.log("Error opening db");
            //console.log("Successfully opened db");
            
            var stmt = conn.prepareSync("insert into RECOVERYTABLES (BOARD, SCORE) values (?, ?)");
            stmt.execute([board, 0], function(err, result) {
                if (err) {
                    //console.log("Error inserting to db");
                    conn.closeSync();
                    return;
                }
                result.closeSync();
                conn.closeSync();
            });            
        });
   
		//board = req.body.board;
		//score = req.body.score;
		res.send({ "status": "error", "message": "updated board and score on server"});
	}
});

app.use('/highscores', highscoreRouter);
app.use('/recovery/board', recoveryBoardRouter);

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
