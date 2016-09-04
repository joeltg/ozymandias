#!/usr/bin/env node
"use strict";

const authenticate = require('./authenticate');
let ID = 0;

function connection(socket, children) {

    const id = ID++;

    const sources = {auth};

    function send(source, content) {
        if (socket.readyState === 1) socket.send(JSON.stringify({source, content}));
    }

    function auth(data) {
        authenticate(data, id, send, sources, children);
    }

    function data(message) {
        const source = message.source, content = message.content;
        if (source in sources) sources[source](content);
    }

    socket.on('message', message => data(JSON.parse(message)));
    socket.on('close', e => ('kill' in sources) && sources.kill('KILL'));
    
    send('auth', 'magic');
}

module.exports = connection;