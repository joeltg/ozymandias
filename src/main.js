/**
 * Created by joel on 8/20/16.
 */

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

import {push, view} from './editor';
import {canvas} from './graphics/canvas';
import {latex} from './graphics/latex';
import {cm_open, cm_save, open, save, load} from './config';

function pipe(message) {
    switch (message.type) {
        case 'canvas':
            return canvas(message);
        case 'latex':
            return latex(message);
        case 'editor':
            return push(message);
        default:
            console.error('message type not recognized', message);
    }
}

const data = ({source, content}) => sources[source](content);
const auth = content => send('auth', {user: false});

const sources = {
    data: content => console.log(content) || pipe(JSON.parse(content)),
    eval: content => console.log(content) || push(JSON.parse(content)),
    auth,
    open,
    save,
    load
};

CodeMirror.commands.kill = cm => send('kill', 'INT');
CodeMirror.commands.save = cm_save;
CodeMirror.commands.open = cm_open;
CodeMirror.commands.view = view;

console.log('connecting to server... ');

socket.onopen    = event => console.log('connected.');
socket.onmessage = event => data(JSON.parse(event.data));
socket.onclose   = event => console.log('lost connection to server.');
