/**
 * Created by joelg on 1/19/17.
 */

const fs = require('fs');
const path = require('path');
const request = require('request');
const uuidV4 = require('uuid/v4');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const username = process.env.USERNAME;
const headers = {'Accept': 'application/json', 'User-Agent': username};

const users = {};
const tokens = {};
const secrets = {};
const root = path.resolve(__dirname, '..');

// fs.readdir(path.resolve(root, 'users'), (error, files) => files && files.forEach(user =>
//     (users[user] = true) && fs.readFile(path.resolve(root, 'users', user, 'auth'), {}, (error, data) =>
//         tokens[data.replace('\n', '')] = user)));

function authenticate(app, render, create) {

    // function loginResponse(req, res) {
    //     const {file} = req.query;
    //     const {lambda} = req.session;
    //     if (lambda) {
    //         const {login, access_token} = lambda;
    //         if (login === tokens[access_token]) {
    //             res.redirect(`/users/${login}${file ? ('/files/' + file) : ''}`);
    //         } else {
    //             delete req.session.lambda;
    //             res.clearCookie('lambda', {path: '/'});
    //             res.render('error.html', {error: 'Error: authentication failed.'});
    //         }
    //     } else {
    //         const uuid = uuidV4();
    //         const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&state=${uuid}`;
    //         secrets[uuid] = true;
    //         res.redirect(url);
    //     }
    // }
    //
    // function authResponse(req, res) {
    //     const {code, state} = req.query;
    //     const {lambda} = req.session;
    //     if (code && state && secrets[state]) {
    //         delete secrets[state];
    //         const url = 'https://github.com/login/oauth/access_token/';
    //         const qs = {client_id, client_secret, code, state};
    //         request.post({url, qs, headers}, function(err, res, body) {
    //             const {access_token} = JSON.parse(body);
    //             const options = {url: 'https://api.github.com/user', qs: {access_token}, headers};
    //             request.get(options, function(err, res, body) {
    //                 const {login} = JSON.parse(body);
    //                 create(res, login, access_token, (user, token) => {
    //                     const url = `/users/${user}`;
    //                     tokens[token] = user;
    //                     users[user] = true;
    //                     req.session.lambda = {login, access_token};
    //                     res.redirect(url);
    //                 });
    //             });
    //         });
    //     } else {
    //         res.render('error.html', {error: 'Error in GitHub OAuth: state mismatch.'});
    //     }
    // }
    //
    // function userResponse(req, res) {
    //     const {user, file} = req.params;
    //     const {lambda} = req.cookies;
    //     if (lambda) {
    //         const {login, access_token} = JSON.parse(lambda);
    //         if ((login === user) && (tokens[access_token] === user)) {
    //             render(req, res);
    //         } else if (login === tokens[access_token]) {
    //             res.redirect(`/users/${login}/${file ? '/files/' + file : ''}`);
    //         } else {
    //             res.clearCookie('lambda', {path: '/'});
    //             res.render('error.html', {error: 'Error in authentication.'})
    //         }
    //     } else {
    //         res.redirect('/login' + (file ? ('?=' + file) : ''));
    //     }
    // }
    //
    // app.get('/login', loginResponse);
    // app.get('/auth', authResponse);
    // app.get('/users/:user/', userResponse);
    // app.get('/users/:user/files/:file', userResponse);
}

module.exports = authenticate;