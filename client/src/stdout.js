/**
 * Created by joelg on 1/25/17.
 */

import {editor} from './editor/editor';
import {state, log} from './utils';

function stdout(text) {
    log(text);
    // editor.replaceRange(text, state.position);
    // state.position = editor.getCursor();
    
    // const {position, printing} = state;
    //
    // editor.setCursor(position);
    //
    // if (printing) {
    //     editor.replaceRange(text, position);
    // } else {
    //     state.printing = true;
    //     // editor.replaceRange('#|\n' + text.trim() + '\n|#');
    //     editor.replaceRange(text, position);
    // }
    //
    // state.position = editor.getCursor();

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

export {stdout};