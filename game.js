/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var util = require('util'),					// Utility resources (logging, object inspection, etc)
	Player = require('./Player').Player,	// Player class
	simples = require('simples');


/**************************************************
** GAME VARIABLES
**************************************************/
var socket,		// Socket controller
	players,	// Array of connected players
	server
	id = 0;


/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Create an empty array to store players
	players = [];

	server = simples(80);

	server.serve('public');

	// Set up Socket.IO to listen on port 8000
	socket = server.ws('/game', {
		mode: 'object'
	}, onSocketConnection);
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/

// New socket connection
function onSocketConnection(connection) {
	connection.data.id = id++;
	util.log('New connection: ' + connection.data.id);

	// Listen for client disconnected
	connection.on('close', function () {
		util.log('Connection closed: ' + connection.data.id);

		var removePlayer = playerById(connection.data.id);

		// Player not found
		if (!removePlayer) {
			util.log('Player not found: ' + connection.data.id);
			return;
		};

		// Remove player from players array
		players.splice(players.indexOf(removePlayer), 1);

		// Broadcast removed player to connected socket clients
		socket.broadcast('remove player', {
			id: connection.data.id
		});
	});

	// Listen for new player message
	connection.on('new player', function (data) {

		util.log('New player: ' + connection.data.id);

		// Create a new player
		var newPlayer = new Player(data.x, data.y, data.color);
		newPlayer.id = connection.data.id;

		// Broadcast new player to connected socket clients
		socket.broadcast('new player', {
			id: newPlayer.id,
			color: newPlayer.color,
			x: newPlayer.getX(),
			y: newPlayer.getY()
		});

		// Send existing players to the new player
		var i, existingPlayer;
		players.forEach(function (existingPlayer) {
			connection.send('new player', {
				id: existingPlayer.id,
				color: existingPlayer.color,
				x: existingPlayer.getX(),
				y: existingPlayer.getY()
			});
		});

		// Add new player to the players array
		players.push(newPlayer);
	});

	// Listen for move player message
	connection.on('move player', function (data) {

		// Find player in array
		var movePlayer = playerById(connection.data.id);

		// Player not found
		if (!movePlayer) {
			util.log('Player not found: ' + connection.data.id);
			return;
		};

		// Update player position
		movePlayer.setX(data.x);
		movePlayer.setY(data.y);

		// Broadcast updated position to connected socket clients
		socket.broadcast('move player', {
			id: movePlayer.id,
			color: movePlayer.color,
			x: movePlayer.getX(),
			y: movePlayer.getY()
		});
	});
};

// Player has moved
;


/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	};

	return false;
};


/**************************************************
** RUN THE GAME
**************************************************/
init();