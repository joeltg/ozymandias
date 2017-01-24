#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const express = require('express');
const uuidV4 = require('uuid/v4');
const handlebars = require('express-handlebars');
const ws = require('ws');
const dotenv = require('dotenv');
const root = path.resolve(__dirname, '..');

dotenv.config({path: path.resolve(root, '.env')});
const auth = process.env.AUTH;
const socket_port = +(process.env.SOCKET_PORT || 3000);
const server_port = +(process.env.SERVER_PORT || 1947);

const Connection = require('./connection');
const connections = {};

const app = express();
app.engine('html', handlebars({extname: '.html'}));
app.set('view engine', 'html');
app.set('views', path.resolve(__dirname, 'views'));
app.use('/images', express.static(path.resolve(root, 'client', 'images')));
app.use('/build', express.static(path.resolve(root, 'client', 'build')));

function render(req, res) {
    const {user, file} = req.params;
    const uuid = uuidV4();
    function exit(connected, open) {
        delete connections[uuid];
    }
    connections[uuid] = new Connection(user, file, exit);
    res.render('index.html', {uuid, user, file, auth, port: socket_port});
}

app.get('/', render);
app.get('/files/:file', render);

if (auth === 'mit') {
    require('./authentication/mit')(app, render);
} else if (auth === 'github') {
    require('./authentication/github')(app, render);
}

app.listen(server_port);

// WebSocket Server
const socket_server = new ws.Server({port: socket_port});
socket_server.on('connection', function(socket) {
    const uuid = socket.upgradeReq.url.substr(1);
    const connection = connections[uuid];
    if (connection) connection.connect(socket);
    else console.error('connection failed');
});

console.log('http server listening on port', server_port);
console.log('socket listening on port', socket_port);

process.on('SIGINT', e => process.exit());
process.on('SIGTERM', e => process.exit());
process.on('exit', (signal, code) => Object.keys(connections).forEach(uuid => connections[uuid].close()));
