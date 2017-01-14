#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const express = require('express');
const uuid = require('uuid/v4');

// const https = require('https');
// const session = require('express-session');
// const passport = require('passport');
// const {Strategy} = require('passport-saml');

const ws = require('uws');
const Connection = require('./server/connection');
const index = path.resolve(__dirname, 'web', 'index.html');
const socket_port = 1947;
// const server_port = 443;
const server_port = 3000;

const log = true;

const connections = {};

const app = express();

app.use('/build', express.static(path.resolve(__dirname, 'web', 'build')));
app.use('/assets', express.static(path.resolve(__dirname, 'web', 'assets')));

// if (dev) {
//     app.get('/', (req, res) => res.sendFile(index));
//     app.listen(server_port);
//     console.log('http server listening on port', server_port);
// }
// else {
//     const key = fs.readFileSync(path.resolve(__dirname, 'certs', 'lambda-key.pem'));
//     const cert = fs.readFileSync(path.resolve(__dirname, 'certs', 'lambda_mit_edu_cert.cer'));
//     const credentials = {key, cert};
//
//     const idpCert = fs.readFileSync(path.resolve(__dirname, 'certs', 'cert_idp.pem'), 'utf8');
//     const spKey = fs.readFileSync(path.resolve(__dirname, 'certs', 'sp-key.pem') ,'utf8');
//     const spCert = fs.readFileSync(path.resolve(__dirname, 'certs', 'sp-cert.pem'), 'utf8');
//
//     const config = {
//       entryPoint: 'https://idp.mit.edu/idp/profile/SAML2/Redirect/SSO',
//       cert: idpCert,
//       identifierFormat: null,
//       issuer: 'https://lambda.mit.edu/shibboleth',
//       callbackUrl: 'https://lambda.mit.edu/auth/callback',
//       decryptionPvk: spKey,
//       privateCert: spKey,
//       acceptedClockSkewMs: 180000,
//       disableRequestedAuthnContext: true,
//       // passReqToCallback: true,
//     };
//     const strategy = new Strategy(config, (profile, done) => done(null, profile));
//     const metadata = strategy.generateServiceProviderMetadata(spCert);
//
//     passport.serializeUser((user, done) => done(null, user));
//     passport.deserializeUser((user, done) => done(null, user));
//     passport.use(strategy);
//
//     app.use(passport.initialize());
//     app.use(passport.session());
//
//     app.get('/', (req, res) => res.sendFile(index));
//
//     const checkAuth = (req, res, next) => req.isAuthenticated() ? next() : res.redirect('/auth');
//     app.get('/u/:user', checkAuth, (req, res) => res.sendFile(index));
//
//     const auth = passport.authenticate('saml', {failureRedirect: '/auth/fail'});
//     app.get('/auth', auth, (req, res) => res.redirect('/'));
//     app.post('/auth/callback', auth, (req, res) => res.redirect('/'));
//     app.get('/auth/fail', (req, res) => res.status(401).send('Login failed'));
//     app.get('/shibboleth', (req, res) => res.type('application/xml').status(200).send(metadata));
//
//     https.createServer(credentials, app).listen(443);
// }

function respond(user) {
    return function(req, res) {
        const {remoteAddress} = req.connection;
        if (remoteAddress in connections) connections[remoteAddress].close();
        connections[remoteAddress] = new Connection(user(req));
        res.sendFile(index);
    }
}

app.get('/', respond(req => path.resolve(__dirname, 'jail')));
app.get('/users/:user', respond(req => path.resolve(__dirname, 'users', req.params.user)));
app.get('/files/:file', respond(req => path.resolve(__dirname, 'jail')));

app.listen(server_port);

if (log) console.log('http server listening on port', server_port);

// WebSocket Server
const socket_server = new ws.Server({port: socket_port});
socket_server.on('connection', function(socket) {
    const {remoteAddress} = socket.upgradeReq.connection;
    const connection = connections[remoteAddress];
    if (connection && !connection.connected) connection.connect(socket);
    else console.error('connection failed');
});

if (log) console.log('socket listening on port', socket_port);

process.on('SIGINT', e => process.exit());
process.on('SIGTERM', e => process.exit());
process.on('exit', (signal, code) => Object.keys(connections).forEach(ip => connections[ip].close()));
