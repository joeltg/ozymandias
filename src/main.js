/**
 * Created by joel on 8/20/16.
 */

import CodeMirror from 'codemirror';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/search/matchesonscrollbar.css';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/scroll/simplescrollbars';
import 'codemirror/addon/scroll/simplescrollbars.css';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/display/panel';
import 'codemirror/addon/selection/active-line';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';

import './sublime';
import './scheme';
import './emacs';

import './styles.css';

import {send, socket} from './connect';
import {cm_open, cm_save, open, save, load} from './config';
import {state, log} from './utils';

import {push, view} from './editor';
import {error} from './error';
import {toggle, canvas} from './canvas';

const pipe = ({source, content}) => sources[source](content);
const auth = content => send('auth', {user: false});
function data(message) {
    switch (message[0]) {
        case 0: // eval
            return push(message.slice(1));
        case 1: // error
            return error(message.slice(1));
        case 2: // canvas
            return canvas(message.slice(1));
        default:
            console.error(message);
    }
}

const sources = {
    data,
    auth,
    open,
    save,
    load,
    stdout: log
};

CodeMirror.commands.view = view;
CodeMirror.commands.save = cm_save;
CodeMirror.commands.open = cm_open;
// CodeMirror.commands.debug = cm => console.log('debug');
CodeMirror.commands.graphics = cm => toggle(cm);
CodeMirror.commands.interrupt = cm => {
    if (state.error) state.error();
    send('kill', 'INT');
};

log('connecting to server...\n');

socket.onopen    = event => log('connected.\n');
socket.onmessage = event => pipe(JSON.parse(event.data));
socket.onclose   = event => log('\nlost connection to server.\n');
