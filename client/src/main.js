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

import './css/main.css';
import './css/hint.css';

import './editor/sublime';
import './editor/scheme';
import './editor/emacs';

import './hint';

import {send, socket} from './connect';
import {cm_open, cm_save, help, open, save, load} from './config';
import {state, stdout} from './utils';

import {value, view} from './editor/editor';
import {error} from './error/error';
import {canvas} from './graphics/canvas';

const types = {
    canvas,
    stdout,
    value,
    error,
    open,
    save,
    load
};

const pipe = ({type, data}) => types[type](data);


CodeMirror.commands.view = view;
CodeMirror.commands.help = help;
CodeMirror.commands.save = cm_save;
CodeMirror.commands.open = cm_open;
CodeMirror.commands.interrupt = cm => {
    if (state.error) state.error.clear();
    send('kill', 'SIGINT');
};

stdout('connecting to server...\n');

socket.onmessage = event => pipe(JSON.parse(event.data));
socket.onerror   = event => console.error(event);
socket.onopen    = event => stdout('connected.\n');
socket.onclose   = event => console.log(event) || stdout('\nlost connection to server\n');
