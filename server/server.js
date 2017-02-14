#!/usr/bin/env node

const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');

const dotenv = require('dotenv');
const uuidV4 = require('uuid/v4');
const express = require('express');
const handlebars = require('express-handlebars');
const WebSocketServer = require('websocket').server;

const Connection = require('./connection');

const root = path.resolve(__dirname, '..');

dotenv.config({path: path.resolve(root, '.env')});
const port = process.env.PORT || 3000;
const auth = process.env.AUTH === 'true';
const scmutils = process.env.SCMUTILS !== 'false';
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
    connections[uuid] = new Connection(user, file, exit, scmutils);
    res.render('index.html', {uuid, user, file, auth, port});
}

app.get('/', render);
app.get('/files/:file', render);

if (auth === 'mit') {
    require('./authentication/mit')(app, render);
} else if (auth === 'github') {
    require('./authentication/github')(app, render);
}

const httpServer = app.listen(port);
const webSocketServer = new WebSocketServer({httpServer, autoAcceptConnections: false});

webSocketServer.on('request', function(request) {
    const {query: {uuid}} = url.parse(request.resource, true);
    const connection = connections[uuid];
    if (uuid && connection) {
        const socket = request.accept('ozymandias', request.origin);
        connection.connect(socket);
    } else {
        request.reject();
    }
});

console.log('server listening on port', port);

process.on('SIGINT', e => process.exit());
process.on('SIGTERM', e => process.exit());
process.on('exit', (signal, code) => Object.keys(connections).forEach(uuid => connections[uuid].close()));
