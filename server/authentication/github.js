/**
 * Created by joelg on 1/19/17.
 */

const fs = require('fs');
const path = require('path');
const request = require('request');
const uuidV4 = require('uuid/v4');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const tokens = {};
const secrets = {};
const root = path.resolve(__dirname, '..', '..');

dotenv.config({path: path.resolve(root, '.env')});

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const username = process.env.USERNAME;
const headers = {'Accept': 'application/json', 'User-Agent': username};

function wrap(file) {
    return file ? '/files/' + file : '';
}

function getLogin(access_token, res, file) {
    const options = {url: 'https://api.github.com/user', qs: {access_token}, headers};
    request.get(options, function(error, response, body) {
        const {login} = JSON.parse(body);
        if (login) {
            tokens[access_token] = login;
            res.redirect('/users/' + login + wrap(file));
        } else {
            delete tokens[access_token];
            res.clearCookie('access_token');
            res.render('error.html', {error: 'Error: authentication failed.'});
        }
    });
}

function loginResponse(req, res) {
    const {file} = req.query;
    const {access_token} = req.cookies;
    if (access_token) {
        getLogin(access_token, res, file || '');
    } else {
        const uuid = uuidV4();
        const state = JSON.stringify({file, uuid});
        const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&state=${state}`;
        secrets[uuid] = true;
        res.redirect(url);
    }
}

function authResponse(req, res) {
    const {code, state} = req.query;
    const {uuid, file} = JSON.parse(state);
    if (code && state && secrets[uuid]) {
        delete secrets[uuid];
        const url = 'https://github.com/login/oauth/access_token/';
        const qs = {client_id, client_secret, code, state};
        request.post({url, qs, headers}, function(error, response, body) {
            const {access_token} = JSON.parse(body);
            res.cookie('access_token', access_token);
            res.redirect('/login?file=' + (file || ''));
        });
    } else {
        res.render('error.html', {error: 'Error in GitHub OAuth: state mismatch.'});
    }
}

function authenticate(app, render) {

    function userResponse(req, res) {
        const {user, file} = req.params;
        const {access_token} = req.cookies;
        if (access_token) {
            if (access_token in tokens) {
                if (tokens[access_token] === user) {
                    render(req, res)
                } else {
                    res.redirect('/users/' + tokens[access_token]);
                }
            } else {
                getLogin(access_token, res, file || '');
            }
        } else {
            res.redirect('/login?file=' + (file || ''));
        }
    }

    app.use(cookieParser());

    app.get('/login', loginResponse);
    app.get('/auth', authResponse);
    app.get('/users/:user/', userResponse);
    app.get('/users/:user/files/:file', userResponse);
}

module.exports = authenticate;