/**
 * Created by joel on 7/17/16.
 */
// for moving up/down the repl history with the arrow keys
const repl_history = [];
let repl_history_pointer = 0;

const repl = CodeMirror(document.getElementById('repl'), {
    mode:  "scheme",
    theme: 'monokai',
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: 'emacs',
    extraKeys: {
        "Enter": eval_repl,
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
    state: 'settings',
    theme: 'monokai',
    keyMap: 'emacs'
};

function push_repl(string, push) {
    repl.waiting = push;
    repl.replaceRange(string, lastPos, getEnd(repl));
    repl.setCursor(lastPos = getEnd(repl));
    repl.markText({line: 0, ch: 0}, lastPos, {readOnly: true, inclusiveLeft: true});
    repl.scrollIntoView();
    if (push) send_data('repl', string);
}

function eval_repl() {
    const value = strip_string(repl.getRange(lastPos, getEnd(repl)));
    if (value) repl_history_pointer = repl_history.push(value);
    editor_position = false;
    push_repl(value + '\n', true);
}

function move_up_repl_history(cm) {
    if (repl_history_pointer < 1) return;
    const string = repl_history[--repl_history_pointer];
    repl.replaceRange(string, lastPos, getEnd(repl));
}

function move_down_repl_history(cm) {
    if (repl_history_pointer > repl_history.length - 1) return;
    const string = ++repl_history_pointer < repl_history.length ? repl_history[repl_history_pointer] : '';
    repl.replaceRange(string, lastPos, getEnd(repl));
}