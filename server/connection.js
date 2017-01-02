#!/usr/bin/env node

const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const uuid = require('uuid/v4');

const delimiter = '\n';

const users = {[path.resolve(__dirname, '..', 'jail')]: true};
const initialize = path.resolve(__dirname, 'initialize.sh');
const start = path.resolve(__dirname, 'start.sh');

// There are four states in the lifecycle of a Connection
// 1. Constructed (connected === false && open === false && pid === null)
// 2. Connected   (connected === true && open === false && pid === null)
// 3. Initialized (connected === true && open === true && pid === null)
// 4. Open        (connected === true && open === true && pid === ###)
// Although states 3 and 4 are essentially identical and are only every briefly out of sync.

class Connection {
    constructor(user) {
        this.user = user;
        this.uuid = uuid();
        this.args = [this.user, this.uuid];
        this.files = path.resolve(this.user, 'files');
        this.buffer = '';
        this.connected = false;
        this.open = false;
        this.pid = null;
    }
    message({source, content}) {
        if (source === 'eval') {
            this.scheme.stdin.write(content);
        }
        else if (source === 'open') {
            fs.readdir(this.files, (error, files) => this.send('open', files));
        }
        else if (source === 'save') {
            const {name, text} = content;
            const file = this.file(name);
            fs.writeFile(file, text, 'utf8', error => this.send('save', !error));
        }
        else if (source === 'load') {
            const {name} = content;
            const file = this.file(name);
            fs.readFile(file, 'utf8', (error, text) => this.send('load', text));
        }
        else if (source === 'kill') {
            if (this.pid) process.kill(this.pid, content);
        }
        else {
            console.error('invalid source', source);
        }
    }
    close() {
        // close() takes states 4, 3, and 2 to state 1
        // due to callbacks from other listeners, close() is almost always called several times during one exit

        // clean up state 4
        if (this.pid) {
            process.kill(this.pid, 'SIGKILL');
        }
        this.pid = null;

        // clean up state 3
        if (this.open) {
            process.kill(this.scheme.pid, 'SIGKILL');
            this.scheme = null;
        }
        this.open = false;

        // clean up state 2
        if (this.connected && this.socket.readyState === 1) {
            this.socket.close();
            this.socket = null;
        }
        this.connected = false;
    }
    connect(socket) {
        this.connected = true;
        this.socket = socket;

        socket.on('message', data => this.open && this.message(JSON.parse(data)));
        socket.on('error', error => console.error('socket', error));
        socket.on('close', event => {
            this.connected = false;
            this.close();
        });

        cp.execFile(initialize, this.args, {}, error => error ? console.error('initialize', error) : this.initialize());
    }
    initialize() {

        const pipe_path = path.resolve(this.user, 'pipes', this.uuid);
        const pipe = fs.createReadStream(pipe_path);
        pipe.on('data', data => this.pipe(data));
        pipe.on('error', error => console.error('pipe', error));

        this.scheme = cp.spawn(start, this.args, {});
        this.open = true;

        this.scheme.on('error', error => console.error('scheme', error));
        this.scheme.on('exit', (code, signal) => {
            this.pid = false;
            this.open = false;
            this.close();
        });

        this.scheme.stdout.on('error', error => console.error('scheme stdout', error));
        this.scheme.stdout.on('data', data => {
            if (this.pid) this.send('stdout', data.toString());
            else this.pid = +data.toString();
        });
    }
    send(source, content) {
        if (this.connected && this.socket.readyState === 1) {
            this.socket.send(JSON.stringify({source, content}));
        }
    }
    data(value) {
        try {
            this.send('data', JSON.parse(value));
        } catch (error) {
            console.error(error);
        }
    }
    pipe(data) {
        const values = (this.buffer + data).split(delimiter);
        this.buffer = values.pop();
        values.forEach(value => this.data(value));
    }
    file(name) {
        return path.resolve(this.user, 'files', name.split('/').join('-'));
    }
}

module.exports = Connection;