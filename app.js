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
	if (err) console.log("Error opening db");
	else console.log("Successfully opened db");
});

//router to handle requests for getting/setting the last board in recovery mode
var recoveryBoardRouter = express.Router();
recoveryBoardRouter.use(function(req, res, next) {
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

recoveryBoardRouter.post('/', function(req, res) {
	//console.log(req);

	if (!req.body.board) {
		res.send({"status": "error", "message": "missing a board"});
	} else if (!req.body.score) {
		res.send({"status": "error", "messsage": "missing a score"});
	} else {

		
		var height = req.body.board[0].length;
		var width = req.body.board.length;
		
		for (var x = 0; x < width; x++) {
			req.body.board[x][height-1] = null;	
			req.body.board[x][height-2] = null;
			req.body.board[x][height-3] = null;
			req.body.board[x][height-4] = null;
		}
	
		board = req.body.board;
		score = req.body.score;
		res.send({ "status": "error", "message": "updated board and score on server"});
	}
});

app.use('/recovery/board', recoveryBoardRouter);

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
