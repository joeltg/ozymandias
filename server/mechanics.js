#!/usr/bin/env node

const path = require('path');
const cp = require('child_process');
const fs = require('fs');

const file_type = '.scm';
const logging = false;

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

function mechanics(user, id, send, sources, children) {
    const location = path.resolve(__dirname, '..');
    const {user_path, util_path, args} = config(user, location, id);
    const initialize = path.resolve(util_path, 'initialize.sh');
    const start = path.resolve(util_path, 'start.sh');
    const pipe_path = path.resolve(user_path, 'pipes');
    const data_path = path.resolve(pipe_path, 'data-' + id.toString());
    const eval_path = path.resolve(pipe_path, 'eval-' + id.toString());

    cp.execFile(initialize, args, {}, err => {
        if (err) return send('error', err.toString());

        const delimiter = '\n';
        const buffers = {data: '', eval: ''};
        const data = fs.createReadStream(data_path);
        data.on('data', data => buffer('data', data.toString()));
        const eval = fs.createReadStream(eval_path);
        eval.on('data', eval => buffer('eval', eval.toString()));
        function buffer(source, content) {
            const values = (buffers[source] + content).split(delimiter);
            buffers[source] = values.pop();
            values.forEach(value => send(source, value));
        }

        const scheme = cp.spawn(start, args, {});
        children[scheme.pid] = scheme;
        scheme.on('error', err => logging && console.error('scheme error:', err));
        scheme.on('close', (code, signal) => logging && console.log('scheme closed with signal', signal));
        scheme.on('exit', (code, signal) => {
            if (logging) console.log('scheme exited with signal', signal);
            if (scheme.pid in children) {
                delete children[scheme.pid];
                fs.unlink(data_path, err => err && console.error(err));
                fs.unlink(eval_path, err => err && console.error(err));
            }
        });

        scheme.stdout.on('data', data => logging && process.stdout.write(data.toString()));
        scheme.stdout.on('error', err => logging && console.err('scheme stdout error', err));

        const file = name => path.resolve(user_path, 'files', name.split('/').join(''));

        sources.eval = data => (scheme.pid in children) && scheme.stdin.write(data);
        sources.kill = data => (scheme.pid in children) && cp.exec(`pkill -${data} -P ${scheme.pid}`);
        sources.save = ({name, text}) => fs.writeFile(file(name), text, 'utf8', err => send('save', !err));
        sources.load = ({name}) => fs.readFile(file(name), 'utf8', (err, text) => send('load', text));
        sources.open = open => fs.readdir(path.resolve(user_path, 'files'), (err, files) => send('open', files));
    });
}

module.exports = mechanics;
