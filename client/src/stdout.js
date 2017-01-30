/**
 * Created by joelg on 1/25/17.
 */

import {editor} from './editor/editor';
import {state, log} from './utils';

function exitPrinter() {
    // const {line, ch} = editor.getCursor();
    // if (ch === 0) {
    //     editor.replaceRange('', {line: line - 1}, {line});
    //     state.position = {line};
    // }
    // else {
    //     state.position = {line: line + 1};
    // }
    // return state.position;
}

function stdout(text) {
    log(text);
    const {position} = state;
    editor.replaceRange(text, position);
    // const {position, mode} = state;
    // if (mode === 'stdout') {
    //     editor.replaceRange(text, position);
    //     state.position = editor.getCursor();
    // } else if (mode === 'error') {
    //     // do something here
    // } else {
    //     state.mode = 'stdout';
    //     editor.replaceRange(`\n#|\n${text}\n|#`, position);
    //     const {line, ch} = editor.getCursor();
    //     editor.setCursor(state.position = {line: line - 1});
    // }
}

export {stdout, exitPrinter};