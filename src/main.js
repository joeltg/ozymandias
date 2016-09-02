import './styles.css';

import {send, socket} from './connect';

import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import './scheme';
import './emacs';
import './sublime';

import {push_repl} from './repl';
import {push_editor} from './editor';
import {canvas} from './graphics/canvas';
import {latex} from './graphics/latex';
import './config';

const repl_delimiter = /\s*\n\d+\s(?:(?:]=)|(?:error))>\s/, pipe_delimiter = '\n';
let repl_buffer = '', pipe_buffer = '';

function graphics(message) {
    if (message.type === 'canvas') canvas(message);
    else if (message.type === 'latex') latex(message);
    else console.error('graphics type not recognized');
}

const sources = {
    auth(content) {
        console.log('authorizing something', content);
        send('auth', content);
    },
    repl(content) {
        push_repl(content, false);
        const repl_values = (repl_buffer + content).split(repl_delimiter);
        repl_buffer = repl_values.pop();
        repl_values.forEach(push_editor);
    },
    pipe(content) {
        const pipe_values = (pipe_buffer + content).split(pipe_delimiter);
        pipe_buffer = pipe_values.pop();
        pipe_values.map(JSON.parse).forEach(graphics);
    }
};

function data({source, content}) {
    sources[source](content);
}

CodeMirror.commands.quit = cm => send('kill', 'SIGINT');
CodeMirror.commands.save = cm => console.log('save!');

push_repl('connecting to server...\n', false);

socket.onopen = event => push_repl('connected to server.\n', false);
socket.onmessage = event => data(JSON.parse(event.data));
socket.onclose = event => push_repl('lost connection to server.\n', false);
