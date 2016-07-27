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
        "Tab": "indentMore",
        "Enter": eval_repl,
        "Ctrl-G": e => send_data('kill', 'SIGINT'),
        "Ctrl-C": cm => send_data('kill', 'SIGQUIT'),
        "Up": move_up_repl_history,
        "Down": move_down_repl_history
    }
});

function push_repl(string, push) {
    repl.replaceRange(string, lastPos, getEnd(repl));
    repl.setCursor(lastPos = getEnd(repl));
    repl.markText({line: 0, ch: 0}, lastPos, {readOnly: true, inclusiveLeft: true});
    repl.scrollIntoView();
    if (push) send_data('repl', string);
}

function eval_repl() {
    const value = repl.getRange(lastPos, getEnd(repl));
    if (value) repl_history_pointer = repl_history.push(value);
    editor_position = false;
    push_repl(value + '\n', true);
}

function move_up_repl_history() {
    if (repl_history_pointer < 1) return;
    const string = repl_history[--repl_history_pointer];
    repl.replaceRange(string, lastPos, getEnd(repl));
}

function move_down_repl_history() {
    if (repl_history_pointer > repl_history.length - 1) return;
    const string = ++repl_history_pointer < repl_history.length ? repl_history[repl_history_pointer] : '';
    repl.replaceRange(string, lastPos, getEnd(repl));
}