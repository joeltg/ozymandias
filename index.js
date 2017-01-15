#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const express = require('express');
const uuidV4 = require('uuid/v4');
const handlebars = require('express-handlebars');

// const https = require('https');
// const session = require('express-session');
// const passport = require('passport');
// const {Strategy} = require('passport-saml');

const ws = require('uws');
const render = require('./server/render');
const Connection = require('./server/connection');
const index = path.resolve(__dirname, 'client', 'index.html');
const socket_port = 1947;
// const server_port = 443;
const server_port = 3000;

const log = true;

const connections = {};

const app = express();

app.engine('html', handlebars({extname: '.html'}));
app.set('view engine', 'html');
app.use(express.static(path.resolve(__dirname, 'client')));

// const key = fs.readFileSync(pa   path.resolve(__dirname, 'certs', 'lambda_mit_edu_cert.cer'));
// const credentials = {key, cert};
//
// const idpCert = fs.readFileSync(path.resolve(__dirname, 'certs', 'cert_idp.pem'), 'utf8');
// const spKey = fs.readFileSync(path.resolve(__dirname, 'certs', 'sp-key.pem') ,'utf8');
// const spCert = fs.readFileSync(path.resolve(__dirname, 'certs', 'sp-cert.pem'), 'utf8');
//
// const config = {
//   entryPoint: 'https://idp.mit.edu/idp/profile/SAML2/Redirect/SSO',
//   cert: idpCert,
//   identifierFormat: null,
//   issuer: 'https://lambda.mit.edu/shibboleth',
//   callbackUrl: 'https://lambda.mit.edu/auth/callback',
//   decryptionPvk: spKey,
//   privateCert: spKey,
//   acceptedClockSkewMs: 180000,
//   disableRequestedAuthnContext: true,
//   // passReqToCallback: true,
// };
// const strategy = new Strategy(config, (profile, done) => done(null, profile));
// const metadata = strategy.generateServiceProviderMetadata(spCert);
//
// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((user, done) => done(null, user));
// passport.use(strategy);
//
// app.use(passport.initialize());
// app.use(passport.session());
//
// app.get('/', (req, res) => res.sendFile(index));
//
// const checkAuth = (req, res, next) => req.isAuthenticated() ? next() : res.redirect('/auth');
// app.get('/u/:user', checkAuth, (req, res) => res.sendFile(index));
//
// const auth = passport.authenticate('saml', {failureRedirect: '/auth/fail'});
// app.get('/auth', auth, (req, res) => res.redirect('/'));
// app.post('/auth/callback', auth, (req, res) => res.redirect('/'));
// app.get('/auth/fail', (req, res) => res.status(401).send('Login failed'));
// app.get('/shibboleth', (req, res) => res.type('application/xml').status(200).send(metadata));
//
// https.createServer(credentials, app).listen(443);


const users = {[undefined]: true};
fs.readdir(path.resolve(__dirname, 'users'), (error, files) => error || files.forEach(file => users[file] = true));

function respond(req, res) {
    const {user, file} = req.params;
    if (user in users) {
        const uuid = uuidV4();
        connections[uuid] = new Connection(user, file, uuid);
        res.render('index', {uuid, user, file});
    } else {
        res.redirect('/' + (file ? ('files/' + file) : ''))
    }
}

app.get('/', respond);
app.get('/files/:file', respond);
app.get('/users/:user/', respond);
app.get('/users/:user/files/:file', respond);

app.listen(server_port);

if (log) console.log('http server listening on port', server_port);

// WebSocket Server
const socket_server = new ws.Server({port: socket_port});
socket_server.on('connection', function(socket) {
    const uuid = socket.upgradeReq.url.substr(1);
    const connection = connections[uuid];
    if (connection) connection.connect(socket);
    else console.error('connection failed');
});

if (log) console.log('socket listening on port', socket_port);

process.on('SIGINT', e => process.exit());
process.on('SIGTERM', e => process.exit());
process.on('exit', (signal, code) => Object.keys(connections).forEach(ip => connections[ip].close()));
