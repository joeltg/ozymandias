#!/usr/bin/env node

const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const request = require('request');
const express = require('express');
const uuidV4 = require('uuid/v4');
const handlebars = require('express-handlebars');
const cookieParser = require('cookie-parser');

const dotenv = require('dotenv');

const ws = require('uws');
const Connection = require('./connection');
const socket_port = 1947;
const server_port = process.argv[2] || 3000;
const production = !!process.argv[3];

const log = true;

const connections = {};
const users = {};
const tokens = {};
const root = path.resolve(__dirname, '..');
const dir = path.resolve(root, 'users');
fs.readdir(dir, (error, files) =>
    files.forEach(user =>
        fs.readFile(path.resolve(root, 'users', user, 'auth'), {}, (error, data) =>
            (users[user] = true) && (tokens[data] = user))));

const app = express();
app.use(cookieParser());
app.engine('html', handlebars({extname: '.html'}));
app.set('view engine', 'html');
app.set('views', path.resolve(__dirname, 'views'));
app.use('/images', express.static(path.resolve(root, 'client', 'images')));
app.use('/build', express.static(path.resolve(root, 'client', 'build')));
app.use('/css', express.static(path.resolve(root, 'client', 'css')));

function response(req, res) {
    const {user, file} = req.params;
    const uuid = uuidV4();
    function close() {
        delete connections[uuid];
    }
    connections[uuid] = new Connection(user, file, uuid, close);
    res.render('index.html', {uuid, user, file});
}


dotenv.config({path: path.resolve(root, '.env')});
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const username = process.env.USERNAME;
const headers = {'Accept': 'application/json', 'User-Agent': username};

app.get('/', response);
app.get('/files/:file', response);

if (production) {
    function loginResponse(req, res) {
        const {file} = req.query;
        const {lambda} = req.cookies;
        if (lambda) {
            const {login, access_token} = JSON.parse(lambda);
            if (login === tokens[access_token]) {
                res.redirect(`/users/${login}${file ? ('/files/' + file) : ''}`);
            } else {
                res.clearCookie('lambda', {path: '/'});
                res.render('error.html', {error: 'Error: authentication failed. Maybe refreshing will help?'});
            }
        } else {
            const uuid = uuidV4();
            const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&state=${uuid}`;
            connections[uuid] = false;
            res.redirect(url);
        }
    }

    function authResponse(req, res) {
        const {code, state} = req.query;
        const {lambda} = req.cookies;
        if (code && state && connections[state] === false) {
            const url = 'https://github.com/login/oauth/access_token/';
            const qs = {client_id, client_secret, code, state};
            request.post({url, qs, headers}, function(error, response, body) {
                const {access_token} = JSON.parse(body);
                const options = {url: 'https://api.github.com/user', qs: {access_token}, headers};
                request.get(options, function(error, response, body) {
                    const {login} = JSON.parse(body);
                    cp.execFile(path.resolve(root, 'make-user.sh'), [login, access_token], {cwd: root}, function(error) {
                        if (error) {
                            res.render('error.html', {error: 'Error creating new user:' + error.toString()});
                        } else {
                            const url = `/users/${login}`;
                            tokens[access_token] = login;
                            users[login] = true;
                            res.cookie('lambda', JSON.stringify({login, access_token}), {path: '/', maxAge: 31540000000});
                            res.redirect(url);
                        }
                    });
                });
            });
        } else {
            res.render('error.html', {error: 'Error in GitHub OAuth: state mismatch. Maybe refreshing will help?'});
        }
    }

    function userResponse(req, res) {
        const {user, file} = req.params;
        const {lambda} = req.cookies;
        if (lambda) {
            const {login, access_token} = JSON.parse(lambda);
            if ((login === user) && (tokens[access_token] === user)) {
                response(req, res);
            } else if (login === tokens[access_token]) {
                res.redirect(`/users/${login}/${file ? '/files/' + file : ''}`);
            } else {
                res.clearCookie('lambda', {path: '/'});
                res.render('error.html', {error: 'Error in authentication. Maybe refreshing will help?'})
            }
        } else {
            res.redirect('/login' + (file ? ('?=' + file) : ''));
        }
    }

    app.get('/login', loginResponse);
    app.get('/auth', authResponse);

    app.get('/users/:user/', userResponse);
    app.get('/users/:user/files/:file', userResponse);

    app.get('/logout', function(req, res) {
        res.clearCookie('lambda', {path: '/'});
        res.redirect('/');
    });
}

app.listen(server_port);

// WebSocket Server
const socket_server = new ws.Server({port: socket_port});
socket_server.on('connection', function(socket) {
    const uuid = socket.upgradeReq.url.substr(1);
    const connection = connections[uuid];
    if (connection) connection.connect(socket);
    else console.error('connection failed');
});

if (log) {
    console.log('http server listening on port', server_port);
    console.log('socket listening on port', socket_port);
}

process.on('SIGINT', e => process.exit());
process.on('SIGTERM', e => process.exit());
process.on('exit', (signal, code) => Object.keys(connections).filter(uuid => connections[uuid]).forEach(uuid => connections[uuid].close()));
