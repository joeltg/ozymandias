#!/usr/bin/env node

/**
 * Created by joelg on 6/2/16.
 * Forked from carbide-scheme-kernel by Kevin Kwok and Guillermo Webster
 * Debugging and editing by gjs
 */

const WebSocketServer = require('ws').Server;
const spawn = require('child_process').spawn;
const server = new WebSocketServer({ port: 1947 });

console.log('listening on port 1947');

const children  = [];
server.on('connection', function(socket)  {

    const scheme = spawn('./start-scheme');
    scheme.stdout.setEncoding('utf8');
    children.push(scheme);

    scheme.on('close', function(code, signal) {
      console.log('scheme closed', signal);
    });

    scheme.stdout.on('data', function(data) {
        process.stdout.write(data.toString());
        socket.send(data.toString());
    });

    socket.on('message', function(message) {
        if (message === "\<INTERRUPT\>")
            scheme.kill("SIGINT");
        else if (message === "\<KILL\>") {
            console.log('user terminated one child process');
            scheme.kill("SIGTERM");
        }
        else scheme.stdin.write(message);
    });

    socket.on('close', function() {
        scheme.kill();
        children.splice(children.indexOf(socket), 1);
    });
});

function cleanExit() { process.exit() }

process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill

process.on('exit', function() {
    console.log('killing', children.length, 'child processes');
    children.forEach(function(child) { child.kill() });
});
