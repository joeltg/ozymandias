#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {MITScheme} = require('mit-scheme');

const utf = 'utf8';

class Connection {
    constructor(name, file, exit) {
        this.name = name;
        this.file = file;
        this.exit = exit;

        this.files = null;
        this.socket = null;
        this.scheme = null;
        this.connected = false;
        this.open = false;
    }
    connect(socket) {
        this.socket = socket;
        this.connected = true;
        this.socket.on('message', data => this.message(JSON.parse(data)));
        this.socket.on('error', error => console.error(error));
        this.socket.on('close', event => {
            this.connected = false;
            this.close();
        });

        this.scheme = new MITScheme(this.name);
        this.scheme.on('open', event => {
            this.open = true;
            this.files = this.scheme.files;
            if (this.file) {
                const file = this.find(this.file);
                fs.readFile(file, utf, (error, text) => this.push('load', text || ''));
            }
        });

        this.scheme.on('data', data => this.send(data));
        this.scheme.on('error', error => console.error(error));
        this.scheme.on('close', event => {
            this.open = false;
            this.close();
        });
    }
    message({type, data}) {
        if (type === 'save' && this.files) {
            const {name, text} = data;
            const file = this.find(name);
            fs.writeFile(file, text, utf, error => this.push('save', !error));
        }
        else if (type === 'load' && this.files) fs.readFile(this.find(data), utf, (error, text) => this.push('load', text || ''));
        else if (type === 'open' && this.files) fs.readdir(this.files, (error, files) => this.push('open', files || []));
        else if (type === 'eval' && this.open) this.scheme.write(data);
        else if (type === 'kill' && this.open) this.scheme.kill(data);
        else console.error('invalid type', type);
    }
    close() {
        this.exit(this.connected, this.open);

        if (this.open && this.scheme.state === 3) {
            this.open = false;
            this.scheme.close();
        }

        if (this.connected && this.socket.readyState === 1) {
            this.connected = false;
            this.socket.close();
        }
    }
    send(message) {
        if (this.connected && this.socket.readyState === 1) {
            this.socket.send(message);
        }
    }
    push(type, data) {
        this.send(JSON.stringify({type, data}));
    }
    find(name) {
        return path.resolve(this.files, name.split('/').join('-'));
    }
}

module.exports = Connection;