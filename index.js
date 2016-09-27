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

const server_port = 3000;
const server = express();
server.use(express.static(path.resolve(__dirname, 'web')));
server.get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'web', 'index.html')));
server.listen(server_port);
console.log('server listening on port', server_port);

process.on('SIGINT', e => process.exit()).on('SIGTERM', e => process.exit());
process.on('exit', function(signal, code) {
    const names = Object.keys(children).map(name => `--chroot ${name}`).join(' ').split(' ');
    cp.spawnSync('schroot', ['--end-session'].concat(names));
    cp.spawnSync('pkill', ['-KILL', '-P', process.pid]);
    process.kill(process.pid, 'SIGKILL');
});
