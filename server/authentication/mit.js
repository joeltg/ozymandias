/**
 * Created by joelg on 1/19/17.
 */

const path = require('path');
const session = require('express-session');
const uuidV4 = require('uuid/v4');

const uuids = {};

function wrap(file) {
    return file ? '/files/' + file : '';
}

function authResponse(req, res) {
    const {uuid, email} = req.query;
    const {session} = req;
    if (email && uuid && uuids[uuid]) {
        const user = email.substring(0, email.indexOf('@'));
        session.uuid = uuid;
        session.user = user;
        res.redirect('/users/' + user + wrap(session.file));
    } else {
        res.render('error.html', {error: 'Authentication error.'});
    }
}

function loginResponse(req, res) {
    const uuid = uuidV4();
    uuids[uuid] = true;
    const url = `https://joelg.scripts.mit.edu:444/auth.pl?http://${req.headers.host}/auth?uuid=${uuid}`;
    res.redirect(url);
}

function authenticate(app, render) {

    function userResponse(req, res) {
        const {session} = req;
        const {user, file} = req.params;
        req.session.file = file;
        if (session.user === user && uuids[session.uuid]) {
            delete uuids[session.uuid];
            render(req, res);
        } else {
            res.redirect('/login');
        }
    }

    const secret = uuidV4();
    app.use(session({secret, resave: false, saveUninitialized: false, cookie: { maxAge: 31540000000 }}));

    app.get('/login', loginResponse);
    app.get('/auth', authResponse);
    app.get('/users/:user/', userResponse);
    app.get('/users/:user/files/:file', userResponse);
    app.get('/logout', (req, res) => res.redirect('/'));
}

module.exports = authenticate;