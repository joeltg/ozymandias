#!/usr/bin/env node
/**
 * Created by joelg on 6/2/16.
 * Debugging and editing by gjs
 */
"use strict";
const port = 1947;
const fs = require('fs'), cp = require('child_process');
const webSocketServer = new require('ws').Server({port});
const scheme_path = process.argv[2], scheme_root = process.argv[3],
    load_path = process.argv[4], pipe_directory = process.argv[5];
let pipe_id = 0;
console.log(`server running at port ${port}`);
const children = {};

webSocketServer.on('connection', socket => {
    const id = pipe_id++, pipe_path = pipe_directory + id;
    const send_data = (source, content) => socket.readyState === 1 && socket.send(JSON.stringify({source, content}));
    process.stdout.write(`ID ${id} connected. Creating pipes... `);

    cp.spawnSync('rm', ['-f', pipe_path + '.in', pipe_path + '.out'], {cwd: scheme_root});
    cp.spawnSync('mkfifo', [pipe_path + '.in', pipe_path + '.out'], {cwd: scheme_root});
    process.stdout.write('OK. Starting scheme... ');

    const scheme = cp.spawn(scheme_path, ['--load', load_path, '--args', pipe_path], {cwd: scheme_root});
    const pid = scheme.pid;
    children[pid] = scheme;
    scheme.on('exit', e => children.hasOwnProperty(pid) && (delete children[pid]) && process.stdout.write(`ID ${id} closed.\n`));
    scheme.stdout.on('data', data => send_data('repl', data.toString()));
    process.stdout.write('OK. Opening pipes... ');

    const write_in_pipe = fs.createWriteStream(scheme_root + pipe_path + '.in');
    const read_out_pipe = fs.createReadStream(scheme_root + pipe_path + '.out');
    read_out_pipe.on('data', data => send_data('pipe', data.toString()));
    process.stdout.write('OK.\n');

    const sources = {
        repl: s => {
            if (children[scheme.pid]) {
                scheme.stdin.write(s);
            }
        },
        pipe: s => write_in_pipe.write(s),
        kill: s => {
            if (children[scheme.pid]) {
                cp.spawnSync('pkill', ['--signal', s, '-P', scheme.pid]);
                scheme.kill(s);
            }
        }
    };
    socket.on('close', event => children.hasOwnProperty(pid) && scheme.kill('SIGKILL'));
    socket.on('message', message => (data => sources[data.source](data.content))(JSON.parse(message)));
});

process.on('SIGINT', e => process.exit()).on('SIGTERM', e => process.exit());
process.on('exit', e => {
    Object.keys(children).forEach(pid => {
        cp.spawnSync('pkill', ['--signal', 'KILL', '-P', pid]);
        children[pid].kill('SIGKILL');
    });
    cp.spawnSync('pkill', ['--signal', 'KILL', '-P', process.pid]);
});
