var simples = require('simples');

var server = simples(80);

server.serve('public');