#!/usr/bin/env node

const path = require('path');
const cp = require('child_process');
const fs = require('fs');

const file_type = '.scm';

const logging = false;

function config(user, location, id) {
    if (user) {
        const user_path = path.resolve(location, 'users', user);
        const initialize = path.resolve(location, 'server', 'user', 'initialize.sh');
        const start = path.resolve(location, 'server', 'user', 'start.sh');
        const args = [location, id.toString(), user];
        return {user_path, initialize ,start, args};
    } else {
        const user_path = path.resolve(location, 'jail');
        const initialize = path.resolve(location, 'server', 'public', 'initialize.sh');
        const start = path.resolve(location, 'server', 'public', 'start.sh');
        const args = [location, id.toString()];
        return {user_path, initialize ,start, args};
    }
}

function mechanics(user, id, send, sources, children) {
    const location = path.resolve(__dirname, '..');
    const {user_path, initialize, start, args} = config(user, location, id);
    const pipe_path = path.resolve(user_path, 'pipes', id.toString());

    cp.execFile(initialize, args, {}, err => {
        if (err) return send('repl', err.toString());

        const pipe = fs.createReadStream(pipe_path);
        pipe.on('data', data => send('pipe', data.toString()));

        const scheme = cp.spawn(start, args, {});
        children[scheme.pid] = scheme;

        scheme.on('exit', (code, signal) => (scheme.pid in children) && delete children[scheme.pid]);
        scheme.on('close', (code, signal) => logging && console.log('scheme closed'));
        scheme.on('error', err => logging && console.error('scheme error', err));

        scheme.stdout.on('data', data => send('repl', data.toString()));
        scheme.stdout.on('error', err => logging && console.log('scheme stdout error', err));

        const file = name => path.resolve(user_path, 'files', name.replace('/', '-') + file_type);

        sources.repl = data => (scheme.pid in children) && scheme.stdin.write(data);
        sources.kill = data => (scheme.pid in children) && cp.exec(`pkill -${data} -P ${scheme.pid}`);
        sources.save = ({name, text}) => fs.writeFile(file(name), text, 'utf8', err => send('save', !err));
        sources.load = ({name}) => fs.readFile(file(name), 'utf8', (err, text) => send('load', text));
        sources.open = () => {
            const directory = path.resolve(user_path, 'files');
            const scm = f => f.substring(f.lastIndexOf('.')) === file_type;
            const name = f => f.substring(0, f.lastIndexOf('.'));
            fs.readdir(directory, (err, files) => send('open', files.filter(scm).map(name)));
        };
    });
}

module.exports = mechanics;