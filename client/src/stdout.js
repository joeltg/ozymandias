/**
 * Created by joelg on 1/25/17.
 */

import {editor} from './editor/editor';
import {state, log} from './utils';

// TODO: something smarter
function stdout(text) {
    log(text);

    editor.replaceRange(text, state.position);
    state.position = editor.getCursor();
}

export {stdout};