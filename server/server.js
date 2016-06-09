#!/usr/bin/env node
"use strict";
/**
 * Created by joelg on 6/2/16.
 * Forked from carbide-scheme-kernel by Kevin Kwok and Guillermo Webster
 * Debugging and editing by gjs
 */

const WebSocketServer = require('ws').Server;
const spawn = require('child_process').spawn;
const server = new WebSocketServer({ port: 1947 });

const start = '<';
const end = '>';

console.log('listening on port 1947');

const children  = [];

server.on('connection', function(socket)  {

    const scheme = spawn('./start-scheme');
    children.push(scheme);
    console.log('scheme opened ' + children.length);

    scheme.on('close', function(code, signal) {
        console.log('scheme closed ' + children.length);
    });

    let consuming = false;
    let buffer = '';

    function consume(string) {
        const start_index = string.indexOf(start);
        const end_index = string.indexOf(end);

        if (consuming) {
            if (end_index > -1) {
                consuming = false;
                buffer += string.substring(0, end_index);
                socket.send(buffer);
                buffer = '';
                if (end_index < string.length - 1) consume(string.substring(end_index + 1));
            }
            else {
                buffer += string;
            }
        }
        else {
            if (start_index > -1) {
                if (start_index > 0) consume(string.substring(0, start_index));
                consuming = true;
                consume(string.substring(start_index + 1));
            }
            else {
                socket.send(JSON.stringify(string));
            }
        }
    }

    scheme.stdout.on('data', function(data) {
        process.stdout.write(data);
        let value = data.toString();
        consume(value);
    });

    socket.on('message', function(message) {
        if (message === "\<INTERRUPT\>")
            scheme.kill("SIGINT");
        else if (message === "\<KILL\>") {
            console.log('user killed one child process');
            scheme.kill("SIGTERM");
        }
        else scheme.stdin.write(message);
    });

    socket.on('close', function() {
        children.splice(children.indexOf(scheme), 1);
        scheme.kill();
    });
});

function cleanExit() { process.exit() }

process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill

process.on('exit', function() {
    console.log('killing', children.length, 'child processes');
    children.forEach(function(child) { child.kill() });
});
