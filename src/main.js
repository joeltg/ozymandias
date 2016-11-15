/**
 * Created by joel on 8/20/16.
 */

import './styles.css';

import {send, socket} from './connect';

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
import './scheme';
import './emacs';
import './sublime';

import {push, view, error} from './editor';
import {state} from './utils';
import {cm_open, cm_save, open, save, load} from './config';

const pipe = ({source, content}) => sources[source](content);
const auth = content => send('auth', {user: false});
function data(message) {
    switch (message[0]) {
        case 0:
            return push(message.slice(1));
        case 1:
            return error(message.slice(1));
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
    print: p => push(['#|\n' + p + '\n|#'])
};

CodeMirror.commands.view = view;
CodeMirror.commands.save = cm_save;
CodeMirror.commands.open = cm_open;
CodeMirror.commands.interrupt = cm => {
    if (state.error) state.error();
    send('kill', 'INT');
};

console.log('connecting to server... ');

socket.onopen    = event => console.log('connected.');
socket.onmessage = event => pipe(JSON.parse(event.data));
socket.onclose   = event => console.log('lost connection to server.');
