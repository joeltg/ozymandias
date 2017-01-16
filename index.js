#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const express = require('express');
const uuidV4 = require('uuid/v4');
const handlebars = require('express-handlebars');

const ws = require('uws');
const Connection = require('./server/connection');
const index = path.resolve(__dirname, 'client', 'index.html');
const socket_port = 1947;
const server_port = process.argv[2] || 3000;

const log = true;

const connections = {};
const users = {[undefined]: true};
fs.readdir(path.resolve(__dirname, 'users'), (error, files) => error || files.forEach(file => users[file] = true));

const app = express();

app.engine('html', handlebars({extname: '.html'}));
app.set('view engine', 'html');
app.set('views', path.resolve(__dirname, 'views'));
app.use(express.static(path.resolve(__dirname, 'client')));

function respond(req, res) {
    const {user, file} = req.params;
    if (user in users) {
        const uuid = uuidV4();
        connections[uuid] = new Connection(user, file, uuid);
        res.render('index.html', {uuid, user, file});
    } else {
        res.redirect('/' + (file ? ('files/' + file) : ''))
    }
}

app.get('/', respond);
app.get('/files/:file', respond);
app.get('/users/:user/', respond);
app.get('/users/:user/files/:file', respond);
app.listen(server_port);

// WebSocket Server
const socket_server = new ws.Server({port: socket_port});
socket_server.on('connection', function(socket) {
    const uuid = socket.upgradeReq.url.substr(1);
    const connection = connections[uuid];
    if (connection) connection.connect(socket);
    else console.error('connection failed');
});

if (log) {
    console.log('http server listening on port', server_port);
    console.log('socket listening on port', socket_port);
}

process.on('SIGINT', e => process.exit());
process.on('SIGTERM', e => process.exit());
process.on('exit', (signal, code) => Object.keys(connections).forEach(uuid => connections[uuid].close()));
