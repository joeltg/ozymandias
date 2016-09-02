#!/usr/bin/env node
"use strict";

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
        console.log('scheme exited');
        if (name in children) {
            console.log('deleting name');
            cp.spawnSync('schroot', ['--chroot', name, '--end-session']);
            delete children[name];
        }
    });

    scheme.stdout.on('data', data => send('repl', data.toString()));
    
    sources.repl = s => (name in children) && scheme.stdin.write(s);
    sources.kill = s => (name in children) && scheme.kill(s);
    sources.exit = s => cp.spawnSync('pkill', ['--signal', 'KILL', '-P', scheme.pid]);
}

module.exports = initialize;