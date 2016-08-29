const path = require('path');
const ws = require('ws');
const express = require('express');
const connection = require('./connection');

const socket_port = 1947;
const socket = new ws.Server({port: socket_port});
socket.on('connection', connection);
console.log('socket listening on port', socket_port);

const server_port = 3000;
const server = express();
server.use(express.static(path.resolve(__dirname, 'web')));
server.get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'web', 'index.html')));
server.listen(server_port);
console.log('server listening on port', server_port);