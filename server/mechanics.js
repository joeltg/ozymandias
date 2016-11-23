#!/usr/bin/env node

const path = require('path');
const cp = require('child_process');
const fs = require('fs');

const delimiter = '\n';

function config(user, location, id) {
    if (user) {
        const user_path = path.resolve(location, 'users', user);
        const util_path = path.resolve(location, 'server', 'user');
        const args = [location, id.toString(), user];
        return {user_path, util_path, args};
    } else {
        const user_path = path.resolve(location, 'jail');
        const util_path = path.resolve(location, 'server', 'public');
        const args = [location, id.toString()];
        return {user_path, util_path, args};
    }
}

function pipe(send) {
    let buffer = '';
    return function(data) {
        const values = (buffer + data).split(delimiter);
        buffer = values.pop();
        values.forEach(function(value) {
            try {
                send('data', JSON.parse(value));
            } catch (e) {
                console.error(e);
            }
        });
    }
}

function mechanics(user, id, send, sources, children) {
    const location = path.resolve(__dirname, '..');
    const {user_path, util_path, args} = config(user, location, id);
    const initialize = path.resolve(util_path, 'initialize.sh');
    const start = path.resolve(util_path, 'start.sh');
    const pipe_path = path.resolve(user_path, 'pipes', id.toString());

    cp.execFile(initialize, args, {}, function(err) {
        if (err) return console.err(err);

        fs.createReadStream(pipe_path).on('data', pipe(send));

        const scheme = cp.spawn(start, args, {});
        children[scheme.pid] = scheme;

        scheme.on('error', err => console.error(err));
        scheme.on('exit', function(code, signal) {
            if (scheme.pid in children) {
                delete children[scheme.pid];
                fs.unlink(pipe_path, err => err && console.error(err));
            }
        });

        scheme.stdout.on('error', err => console.err('scheme stdout error', err));
        scheme.stdout.on('data', data => send('stdout', data.toString()));

        const file = name => path.resolve(user_path, 'files', name.split('/').join(''));

        sources.eval = data => (scheme.pid in children) && scheme.stdin.write(data);
        sources.kill = data => (scheme.pid in children) && cp.exec(`pkill -${data} -P ${scheme.pid}`);
        sources.save = ({name, text}) => fs.writeFile(file(name), text, 'utf8', err => send('save', !err));
        sources.load = ({name}) => fs.readFile(file(name), 'utf8', (err, text) => send('load', text));
        sources.open = open => fs.readdir(path.resolve(user_path, 'files'), (err, files) => send('open', files));
    });
}

module.exports = mechanics;
