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

ibmdb.open("DRIVER={DB2};DATABASE=SQLDB;HOSTNAME=75.126.155.153;UID=user17653;PWD=tjVBuwXpyqa5;PORT=50000;PROTOCOL=TCPIP", function (err,conn) {
	if (err) return console.log("Error opening db");
    console.log("Successfully opened db");
    
    var result = conn.querySync("insert into USERS (ID, OAUTH_PROVIDER, OAUTH_UID, USERNAME) values (4206969, 'jews', 'did', '9/11')");
 
    conn.commitTransactionSync();
 
    var query = conn.querySync("select * from USERS");
    console.log(query);
    
    conn.closeSync();
});

//router to handle requests for getting/setting the last board in recovery mode
var recoveryBoardRouter = express.Router();
recoveryBoardRouter.use(function(req, res, next) {
	next();
});


var highscoresRouter = express.Router();
highscoresRouter.use(function(req, res, next) {
	next();
});



//temporarily saving board as a variable instead of in database
var board = [];
var score = 0;

//when the route is '/recovery/board' and type of request is 'get'
recoveryBoardRouter.get('/', function(req, res) {
	//if board is empty, send and empty board
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
});

highscoresRouter.post('/recovery', function(req, res) {
    if (!req.body.score) {
        res.send({"status": "error", "message": "missing a score"});
    } else if (!req.body.username) {
        res.send({"status": "error", "message": "missing a username"});
    }
    
    var score = req.body.score;
    var username = req.body.username;
    
    ibmdb.open("DRIVER={DB2};DATABASE=SQLDB;HOSTNAME=75.126.155.153;UID=user17653;PWD=tjVBuwXpyqa5;PORT=50000;PROTOCOL=TCPIP", function (err,conn) {
        if (err) return console.log("Error opening db");
        console.log("Successfully opened db");
        var stmt = conn.prepareSync("insert into RECOVERYSCORES (NAME, SCORE) values (?, ?)");
        stmt.execute([username, score], function(err, result) {
                if (err) {
                    console.log("Error inserting to db");
                    conn.closeSync();
                    return;
                }
                result.closeSync();
                conn.closeSync();
            });
    });

});

highscoresRouter.post('/classic', function(req, res) {



});

highscoresRouter.post('/enemy', function(req, res) {

});

recoveryBoardRouter.post('/', function(req, res) {
	//console.log(req);

	if (!req.body.board) {
		res.send({"status": "error", "message": "missing a board"});
	} else if (!req.body.score) {
		res.send({"status": "error", "messsage": "missing a score"});
	} else {
        
        
        var board = req.body.board;
        var ROW_LENGTH = 15;
        var ROW_COUNT = 3;
        for (int i = 0; i < 15; i++) {
            for (int j = 0; j < 12; j++) {
                if (j < (15-3))
                    continue;
                board[i * 15 + j] = '9';
            }
        }
        ibmdb.open("DRIVER={DB2};DATABASE=SQLDB;HOSTNAME=75.126.155.153;UID=user17653;PWD=tjVBuwXpyqa5;PORT=50000;PROTOCOL=TCPIP", function (err,conn) {
            if (err) return console.log("Error opening db");
            console.log("Successfully opened db");
            
            var stmt = conn.prepareSync("insert into RECOVERYTABLES (AVGSCORE, BOARD) values (?, ?)");
            stmt.execute([0, board], function(err, result) {
                if (err) {
                    console.log("Error inserting to db");
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

app.use('/highscores', highscoresRouter);
app.use('/recovery/board', recoveryBoardRouter);

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
