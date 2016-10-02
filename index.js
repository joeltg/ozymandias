#!/usr/bin/env node

const path = require('path');
const cp = require('child_process');
const ws = require('uws');
const express = require('express');
const connection = require('./server/connection');
const children = {};

const socket_port = 1947;
const socket = new ws.Server({port: socket_port});
socket.on('connection', socket => connection(socket, children));
console.log('socket listening on port', socket_port);

const server_port = process.argv[2] || 80;
const server = express();
const index = path.resolve(__dirname, 'web', 'index.html');
server.use(express.static(path.resolve(__dirname, 'web')));
server.get('/', (req, res) => res.sendFile(index));
server.get('/:user', (req, res) => res.sendFile(index));
server.listen(server_port);
console.log('server listening on port', server_port);

process.on('SIGINT', e => process.exit()).on('SIGTERM', e => process.exit());
process.on('exit', function(signal, code) {
    console.log('process exiting');
    Object.keys(children).forEach(pid => {
        console.log('killing', pid);
        process.kill(pid, 'SIGTERM');
    });
    process.kill(process.pid, 'SIGKILL');
});
