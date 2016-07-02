#!/usr/bin/env node
/**
 * Created by joelg on 6/2/16.
 * Debugging and editing by gjs
 */
"use strict";

const spawn = require('child_process').spawn;
const WebSocketServer = require('ws').Server;

// argv[0] and argv[1] are 'node' and 'server.js', respectively.
const default_scheme_path = './start-scheme';
const scheme_path = process.argv[2] || default_scheme_path;

const default_log_directory = './logs/';
const log_directory = process.argv[3] || default_log_directory;
let log_id = 0;

const default_utils_directory = './utils/';
const utils_directory = process.argv[4] || default_utils_directory;
console.log(scheme_path, log_directory, utils_directory);

const port = 1947;
const server = new WebSocketServer({port: port});
console.log(`listening on port ${port}`);

const children = [];

server.on('connection', socket => {

    const log_path = log_directory + log_id++;

    // spawn scheme process
    const scheme = spawn(scheme_path, [log_path, utils_directory]);
    children.push(scheme);
    console.log('scheme opened ' + children.length);

    // pipe stdout from the scheme process to the client as console output
    scheme.stdout.on('data', data => socket.send(JSON.stringify({
        source: 'console',
        content: data.toString()
    })));

    // pipe stderr from the scheme process to the client as graphics output
    scheme.stderr.on('data', data => socket.send(JSON.stringify({
        source: 'graphics',
        content: data.toString()
    })));

    scheme.on('close', event => children.splice(children.indexOf(scheme), 1));

    // pipe console input from the client to the scheme process
    socket.on('message', message => {
        if (message === "\<SIGINT\>") scheme.kill("SIGINT");
        else scheme.stdin.write(message);
    });

    socket.on('close', event => scheme.kill('SIGKILL'));

});

process.on('SIGINT', e => process.exit());
process.on('SIGTERM', e => process.exit());
process.on('exit', e => children.forEach(child => child.kill('SIGTERM')));

