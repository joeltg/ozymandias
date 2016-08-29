import CodeMirror from 'codemirror';
import {send} from './connect';
import {default_keyMap, default_state, default_theme, state, get_end, strip_string} from './utils';

// for moving up/down the repl history with the arrow keys
const repl_history = [];
let repl_history_pointer = 0;

const repl_element = document.getElementById('repl');
const repl = CodeMirror(repl_element, {
    mode: 'scheme',
    theme: default_theme,
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: default_keyMap,
    extraKeys: {
        'Enter': eval_repl
    }
});

CodeMirror.commands.previous = move_up_repl_history;
CodeMirror.commands.next = move_down_repl_history;

repl.waiting = false;

repl.settings = {
    name: 'repl',
    labels: {
        'eval-line': {
            emacs: 'Enter',
            sublime: 'Enter'
        }
    },
    state: default_state,
    theme: default_theme,
    keyMap: default_keyMap
};

function push_repl(string, push) {
    repl.waiting = push;
    repl.replaceRange(string, state.last_position, get_end(repl));
    repl.setCursor(state.last_position = get_end(repl));
    repl.markText({line: 0, ch: 0}, state.last_position, {readOnly: true, inclusiveLeft: true});
    repl.scrollIntoView();
    if (push) send('repl', string);
}

function eval_repl() {
    const value = strip_string(repl.getRange(state.last_position, get_end(repl)));
    if (value) repl_history_pointer = repl_history.push(value);
    state.editor_position = false;
    push_repl(value + '\n', true);
}

function move_up_repl_history(cm) {
    if (repl_history_pointer < 1) return;
    const string = repl_history[--repl_history_pointer];
    repl.replaceRange(string, state.last_position, get_end(repl));
}

function move_down_repl_history(cm) {
    if (repl_history_pointer > repl_history.length - 1) return;
    const string = ++repl_history_pointer < repl_history.length ? repl_history[repl_history_pointer] : '';
    repl.replaceRange(string, state.last_position, get_end(repl));
}

export {repl, push_repl}