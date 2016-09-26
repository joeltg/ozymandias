#!/usr/bin/env node

const path = require('path');
const cp = require('child_process');
const fs = require('fs');

const namespace = 'scheme-';

const init_path = path.resolve(__dirname, 'initialize.sh');
const start_path = path.resolve(__dirname, 'start.sh');

function initialize(user, id, send, sources, children) {
    const pipe = `/pipes/${id}`;
    const chroot = namespace + user;
    const name = chroot + '-' + id;
    const user_path = path.resolve(__dirname, '..', 'jail', user);
    const pipe_path = path.resolve(__dirname, '..', 'jail', user, 'pipes', id.toString());

    cp.spawnSync(init_path, [user_path, pipe_path]);
    const scheme = cp.spawn(start_path, [chroot, pipe, name]);

    fs.createReadStream(pipe_path).on('data', data => send('pipe', data.toString()));
    children[name] = scheme;

    scheme.on('exit', e => {
        if (name in children) {
            cp.spawnSync('schroot', ['--chroot', name, '--end-session']);
            delete children[name];
        }
    });

    scheme.stdout.on('data', data => send('repl', data.toString()));
    scheme.stdout.on('error', err => console.error(err));

    function save(data) {
        const name = data.name.replace(/\W/g, ''), text = data.text;
        const path = user_path + '/files/' + name;
        fs.writeFile(path, text, 'utf8', err => send('save', !err));
    }

    function load(data) {
        const name = data.replace(/\W/g, '');
        const path = user_path + '/files/' + name;
        fs.readFile(path, 'utf8', (err, text) => send('load', text));
    }

    function open(data) {
        const path = user_path + '/files/';
        fs.readdir(path, (err, files) => send('open', files));
    }

    function repl(data) {
        if (name in children) {
            scheme.stdin.write(data);
        }
    }

    function kill(data) {
        if (name in children) {
            cp.spawnSync('pkill', ['--signal', data, '-P', scheme.pid]);
        }
    }

    sources.save = save;
    sources.load = load;
    sources.open = open;
    sources.repl = repl;
    sources.kill = kill;
}

module.exports = initialize;