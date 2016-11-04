#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const {Strategy} = require('passport-saml');
const ws = require('uws');
const connection = require('./server/connection');
const index = path.resolve(__dirname, 'web', 'index.html');
const children = {};

const config = {
    path: '/auth/callback',
    entryPoint: 'https://idp.mit.edu/idp/profile/SAML2/Redirect/SSO',
    issuer: 'passport-saml'
};
const strategy = new Strategy(config, (profile, done) => done(null, profile));
const metadata = strategy.generateServiceProviderMetadata(fs.readFileSync(__dirname + '/cert/cert.pem', 'utf8'));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
passport.use(strategy);

const server_port = process.argv[2] || 80;
const server = express();
server.use(express.static(path.resolve(__dirname, 'web')));

server.use(passport.initialize());
server.use(passport.session());

server.get('/', (req, res) => res.sendFile(index));

// server.get('/:user', (req, res) => res.sendFile(index));
const checkAuth = (req, res, next) => req.isAuthenticated() ? next() : res.redirect('/auth');
server.get('/u/:user', checkAuth, (req, res) => res.sendFile(index));

const auth = passport.authenticate('saml', {failureRedirect: '/auth/fail'});
server.get('/auth', auth, (req, res) => res.redirect('/'));
server.post('/auth/callback', auth, (req, res) => res.redirect('/'));
server.get('/auth/fail', (req, res) => res.status(401).send('Login failed'));
server.get('/shibboleth', (req, res) => res.type('application/xml').status(200).send(metadata));

server.listen(server_port);
console.log('server listening on port', server_port);


// WebSocket Server
const socket_port = 1947;
const socket = new ws.Server({port: socket_port});
socket.on('connection', socket => connection(socket, children));
console.log('socket listening on port', socket_port);


process.on('SIGINT', e => process.exit()).on('SIGTERM', e => process.exit());
process.on('exit', function(signal, code) {
    console.log('process exiting');
    Object.keys(children).forEach(pid => {
        console.log('killing', pid);
        process.kill(pid, 'SIGTERM');
    });
    process.kill(process.pid, 'SIGKILL');
});
