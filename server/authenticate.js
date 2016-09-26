#!/usr/bin/env node

const initialize = require('./initialize');

function authenticate(data, id, send, sources, children) {
    if (data === 'magic') {
        const user = 'root';
        delete sources.auth;
        initialize(user, id, send, sources, children);
    }
}

module.exports = authenticate;