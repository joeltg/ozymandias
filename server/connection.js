#!/usr/bin/env node

const fs = require('fs');
const authenticate = require('./authenticate');
let ID = 0;

function connection(socket, children) {
    const id = ID++;

    const send = (source, content) => (socket.readyState === 1) && socket.send(JSON.stringify({source, content}));
    const auth = data => authenticate(data, id, send, sources, children);
    const data = ({source, content}) => (source in sources) && sources[source](content);

    const sources = {auth};

    socket.on('message', message => data(JSON.parse(message)));
    socket.on('close', e => ('kill' in sources) && sources.kill('KILL'));

    send('auth', 'magically');
}

module.exports = connection;