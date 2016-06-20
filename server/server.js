#!/usr/bin/env node
/**
 * Created by joelg on 6/2/16.
 * Forked from carbide-scheme-kernel by Kevin Kwok and Guillermo Webster
 * Debugging and editing by gjs
 */

var scheme_path = '/usr/local/mit-scheme/bin/mit-scheme';
process.argv.forEach(function(arg, index) {
    if ((arg === '--scheme' || arg === '-s') && process.argv.length > index + 1)
        scheme_path = process.argv[index + 1];
});

// const scheme_path = './start-mechanics-on-maharal';
// const scheme_path = './start-mechanics-from-distribution';
// const scheme_path = './start-mechanics-in-chroot-jail';
// const scheme_path = '/usr/local/mit-scheme/bin/mit-scheme';

const port = 1947;
const log_delimiter = '\n';

const fs = require('fs');
const spawn = require('child_process').spawn;
const WebSocketServer = require('ws').Server;
const server = new WebSocketServer({ port: port });
console.log(`listening on port ${port}`);

var log_id = 0;
const children  = [];

server.on('connection', function(socket)  {

    // create empty log file
    const log_path = `logs\/${log_id++}`;
    fs.closeSync(fs.openSync(log_path, 'w'));

    // spawn scheme process
    const scheme = spawn(scheme_path, ['-eval', `(define out-file-name "${log_path}")`]);

    children.push(scheme);
    console.log('scheme opened ' + children.length);


    // pipe stdout from the scheme process to the client
    scheme.stdout.on('data', function(data) {
        socket.send(JSON.stringify(data.toString()));
    });

    scheme.on('close', function(code, signal) {
        console.log('scheme closed ' + children.length);
    });


    // piping code from the client to the scheme process
    socket.on('message', function(message) {
        if (message === "\<INTERRUPT\>") scheme.kill("SIGINT");
        else if (message === "\<KILL\>") scheme.kill("SIGTERM");
        else scheme.stdin.write(message);
    });

    socket.on('close', function() {
        children.splice(children.indexOf(scheme), 1);
        scheme.kill();
    });


    // reading graphics output from the log file
    const log = spawn('tail', ['-f', log_path]);
    var log_buffer = '';
    log.stdout.on('data', function(data) {
        const values = (log_buffer + data.toString()).split(log_delimiter);
        values.slice(0, values.length - 1).forEach(function(value) {
            socket.send(value);
        });
        log_buffer = values[values.length - 1];
    });

});

function cleanExit() { process.exit() }

process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill

process.on('exit', function() {
    console.log('killing', children.length, 'child processes');
    children.forEach(function(child) { child.kill() });
});
