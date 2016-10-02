import './styles.css';

import {send, socket} from './connect';

import CodeMirror from 'codemirror';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/search/matchesonscrollbar.css';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/scroll/simplescrollbars';
import 'codemirror/addon/scroll/simplescrollbars.css';

import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/selection/active-line';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import './scheme';
import './emacs';
import './sublime';

import {push_repl} from './repl';
import {push_editor, toggle_view} from './editor';
import {canvas} from './graphics/canvas';
import {latex} from './graphics/latex';
import {cm_open, cm_save, open, save, load} from './config';

const delimiter = '\n';
let buffer = '';

function pipe(message) {
    switch (message.type) {
        case 'canvas':
            return canvas(message);
        case 'latex':
            return latex(message);
        case 'editor':
            return push_editor(message);
        default:
            console.error('message type not recognized', message);
    }
}

const data = ({source, content}) => sources[source](content);
const auth = content => send('auth', {user: false});
const repl = content => push_repl(content, false);

const sources = {
    pipe(content) {
        const values = (buffer + content).split(delimiter);
        buffer = values.pop();
        values.map(JSON.parse).forEach(pipe);
    },
    auth, repl, open, save, load
};

CodeMirror.commands.kill = cm => send('kill', 'INT');
CodeMirror.commands.save = cm_save;
CodeMirror.commands.open = cm_open;
CodeMirror.commands.view = toggle_view;

repl('connecting to server... ');

socket.onopen    = event => repl('connected.\n');
socket.onmessage = event => data(JSON.parse(event.data));
socket.onclose   = event => repl('lost connection to server.\n');
