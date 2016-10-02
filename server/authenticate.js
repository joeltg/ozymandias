#!/usr/bin/env node

const initialize = require('./mechanics');

function authenticate({user}, id, send, sources, children) {
    delete sources.auth;
    initialize(user, id, send, sources, children);
}

module.exports = authenticate;