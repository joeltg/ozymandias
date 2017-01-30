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
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';

import './css/main.css';
import './css/hint.css';

import './editor/sublime';
import './editor/scheme';
import './editor/emacs';

import './hint';

import {send, socket} from './connect';
import {cm_help} from './config';
import {cm_open, cm_save} from './file';
import {state, log} from './utils';

import {cm_view} from './editor/editor';

import {pipe} from './pipe';

CodeMirror.commands.view = cm_view;
CodeMirror.commands.help = cm_help;
CodeMirror.commands.save = cm_save;
CodeMirror.commands.open = cm_open;
CodeMirror.commands.interrupt = cm => {
    if (state.error) state.error.clear();
    send('kill', 'SIGINT');
};

log('connecting to server...');

socket.onmessage = event => pipe(JSON.parse(event.data));
socket.onerror   = event => console.error(event);
socket.onopen    = event => log('connected.');
socket.onclose   = event => log('lost connection to server');
