#!/usr/bin/env node
/**
 * Created by joelg on 6/2/16.
 * Debugging and editing by gjs
 */
"use strict";

const spawn = require('child_process').spawn;
const WebSocketServer = require('ws').Server;

// argv[0] and argv[1] are 'node' and 'server.js', respectively.
const default_load_with_logs_path = './load-with-logs';
const load_with_logs_path = process.argv[2] || default_load_with_logs_path;

const default_log_directory = './logs/';
const log_directory = process.argv[3] || default_log_directory;
let log_id = 0;

const default_utils_directory = './utils/';
const utils_directory = process.argv[4] || default_utils_directory;

const default_scheme_path = '/usr/local/scmutils/mit-scheme/bin/scheme --library /usr/local/scmutils/mit-scheme/lib';
const scheme_path = process.argv[5] || default_scheme_path;

console.log(load_with_logs_path, log_directory, utils_directory, scheme_path);

const port = 1947;
const server = new WebSocketServer({port: port});
console.log(`listening on port ${port}`);

const children = [];

server.on('connection', socket => {
    let alive = true;
    const id = log_id++;
    const log_path = log_directory + id;

    // spawn scheme process
    const scheme = spawn(load_with_logs_path, [log_path, utils_directory, scheme_path]);
    children.push(scheme);

    // pipe stdout from the scheme process to the client as console output
    scheme.stdout.on('data', data => {
	if (alive && socket.readyState === 1) socket.send(JSON.stringify({
	    source: 'client_repl',
	    content: data.toString()
	}));
    });

    // pipe stderr from the scheme process to the client as graphics output
    scheme.stderr.on('data', data => {
	if (alive && socket.readyState === 1) socket.send(JSON.stringify({
	    source: 'graphics',
	    content: data.toString()
	}));
    });

    scheme.on('close', event => {
	alive = false;
	children.splice(children.indexOf(scheme), 1);
	console.log('scheme closed with id#' + id);
    });

    // pipe console input from the client to the scheme process
    socket.on('message', message => {
	if (alive) {
            if (message === "\<SIGINT\>") scheme.kill("SIGINT");
            else {
		message = JSON.parse(message);
		const source = message.source, content = message.content;
		if (source === 'client_repl') scheme.stdin.write(content);
		else if (source === 'graphics') scheme.stdin.write(content);
		else console.error('invalid message type');
            }
	}});

    socket.on('close', event => {
	if (alive) scheme.kill('SIGKILL')
    });

    console.log('scheme opened with id#' + id);
});

process.on('SIGINT', e => process.exit());
process.on('SIGTERM', e => process.exit());
process.on('exit', e => children.forEach(child => child.kill('SIGTERM')));

