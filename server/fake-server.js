#!/usr/bin/env node

const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');

const dotenv = require('dotenv');
const uuidV4 = require('uuid/v4');
const request = require('request');
const express = require('express');
const handlebars = require('express-handlebars');

const root = path.resolve(__dirname, '..');

dotenv.config({path: path.resolve(root, '.env')});
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
const app = express();
app.engine('html', handlebars({extname: '.html'}));
app.set('view engine', 'html');
app.set('views', path.resolve(__dirname, 'views'));
app.use('/images', express.static(path.resolve(root, 'client', 'images')));
app.use('/build', express.static(path.resolve(root, 'client', 'build')));

function render(req, res) {
    request("http://" + host + ":" + port + "/please", function(error, response, body) {
        const {uuid} = JSON.parse(body);
        res.render('index.html', {uuid, user: null, file: null, auth: null, port, host});
    });
}

app.get('/', render);

const httpServer = app.listen(port);
console.log('server listening on port', port);

process.on('SIGINT', e => process.exit());
process.on('SIGTERM', e => process.exit());
