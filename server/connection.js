#!/usr/bin/env node

const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const delimiter = '\n';

const initialize = path.resolve(__dirname, 'initialize.sh');
const start = path.resolve(__dirname, 'start.sh');

const jail = path.resolve(__dirname, '..', 'jail');

// There are four states in the lifecycle of a Connection
// 1. Constructed (connected === false && open === false && pid === null)
// 2. Connected   (connected === true && open === false && pid === null)
// 3. Initialized (connected === true && open === true && pid === null)
// 4. Open        (connected === true && open === true && pid === ###)
// Although states 3 and 4 are essentially identical and are only every briefly out of sync.

class Connection {
    constructor(user, file, uuid) {
        this.user = user;
        this.file = file;
        this.uuid = uuid;
        this.path = this.user ? path.resolve(__dirname, '..', 'users', this.user) : jail;
        this.pipe = path.resolve(this.path, 'pipes', this.uuid);
        this.args = [this.path, this.uuid];
        this.files = path.resolve(this.path, 'files');
        this.buffer = '';
        this.socket = null;
        this.connected = false;
        this.open = false;
        this.pid = null;
    }
    message({source, content}) {
        if (source === 'save' && this.open) {
            const {name, text} = content;
            const file = this.find(name);
            fs.writeFile(file, text, 'utf8', error => this.send('save', !error));
        }
        else if (source === 'load') {
            const {file} = content;
            fs.readFile(this.find(file), 'utf8', (error, text) => this.send('load', text || ''));
        }
        else if (source === 'open') fs.readdir(this.files, (error, files) => this.send('open', files));
        else if (source === 'eval' && this.open ) this.scheme.stdin.write(content);
        else if (source === 'kill' && this.open ) this.pid ? process.kill(this.pid, content) : null;
        else console.error('invalid source', source);
    }
    close() {
        // close() takes states 4, 3, and 2 to state 1
        // due to callbacks from other listeners, close() is almost always called several times during one exit

        const {pid, open, connected} = this;
        // clean up state 4
        if (pid) {
            this.pid = null;
            process.kill(pid, 'SIGKILL');
        }

        // clean up state 3
        if (open) {
            this.open = false;
            process.kill(this.scheme.pid, 'SIGKILL');
            this.scheme = null;
        }

        // clean up state 2
        if (connected && this.socket.readyState === 1) {
            fs.unlink(this.path, this.error('remove pipe'));
            this.connected = false;
            this.socket.close();
            this.socket = null;
        }
    }
    error(source, dispatch) {
        if (dispatch) return (error, message) => error ? console.error(source, error) : dispatch(message);
        else return error => console.error(source, error);
    }
    connect(socket) {
        this.connected = true;
        this.socket = socket;

        if (this.file) fs.readFile(this.find(this.file), 'utf8', (error, text) => this.send('load', text || ''));

        socket.on('message', data => this.message(JSON.parse(data)));
        socket.on('error', this.error('socket'));
        socket.on('close', event => {
            this.connected = false;
            this.close();
        });

        cp.execFile(initialize, this.args, {}, this.error('initialize', () => this.initialize()));
    }
    initialize() {
        fs.createReadStream(this.pipe).on('data', data => this.push(data)).on('error', this.error('pipe'));

        this.scheme = cp.spawn(start, this.args, {});
        this.open = true;

        this.scheme.on('error', this.error('scheme'));
        this.scheme.on('exit', (code, signal) => {
            this.pid = false;
            this.open = false;
            this.close();
        });

        this.scheme.stdout.on('error', this.error('scheme stdout'));
        this.scheme.stdout.on('data', data => {
            if (this.pid) this.send('stdout', data.toString());
            else this.pid = +data.toString().trim();
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
    push(data) {
        const values = (this.buffer + data).split(delimiter);
        this.buffer = values.pop();
        values.forEach(value => this.data(value));
    }
    find(name) {
        return path.resolve(this.path, 'files', name.split('/').join('-'));
    }
}

module.exports = Connection;