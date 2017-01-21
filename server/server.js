#!/usr/bin/env node

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const request = require('request');
const express = require('express');
const uuidV4 = require('uuid/v4');
const handlebars = require('express-handlebars');
const session = require('express-session');
const dotenv = require('dotenv');

const ws = require('uws');
const Connection = require('./connection');
const socket_port = 1947;
const server_port = process.argv[2] || 3000;
const authentication = process.argv[3];

const log = true;

const connections = {};
const root = path.resolve(__dirname, '..');

const app = express();
const secret = uuidV4();
app.use(session({secret, resave: false, saveUninitialized: false, cookie: { maxAge: 31540000000 }}));
app.engine('html', handlebars({extname: '.html'}));
app.set('view engine', 'html');
app.set('views', path.resolve(__dirname, 'views'));
app.use('/images', express.static(path.resolve(root, 'client', 'images')));
app.use('/build', express.static(path.resolve(root, 'client', 'build')));
app.use('/css', express.static(path.resolve(root, 'client', 'css')));

function render(req, res) {
    const {user, file} = req.params;
    const uuid = uuidV4();
    function close() {
        delete connections[uuid];
    }
    connections[uuid] = new Connection(user, file, uuid, close);
    res.render('index.html', {uuid, user, file});
}

const make_user = path.resolve(root, 'make-user.sh');
function create(res, user, auth, callback) {
    cp.execFile(make_user, [user, auth], {cwd: root}, function(error) {
        if (error) res.render('error.html', {error: 'Error creating new user: ' + error.toString()});
        else callback();
    });
}

dotenv.config({path: path.resolve(root, '.env')});

app.get('/', render);
app.get('/files/:file', render);

if (authentication === 'mit') {
    require('./authentication/mit')(app, render, create);
} else if (authentication === 'github') {
    require('./authentication/github')(app, render, create);
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

if (log) {
    console.log('http server listening on port', server_port);
    console.log('socket listening on port', socket_port);
}

process.on('SIGINT', e => process.exit());
process.on('SIGTERM', e => process.exit());
process.on('exit', (signal, code) => Object.keys(connections).filter(uuid => connections[uuid]).forEach(uuid => connections[uuid].close()));
