/**
 * Created by joel on 7/17/16.
 */
let lastPos = {line: 0, ch: 0};
let editor_position = false;

const editor = CodeMirror(document.getElementById('editor'), {
    mode:  "scheme",
    theme: 'monokai',
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: 'emacs',
    extraKeys: CodeMirror.normalizeKeyMap({
        "Tab": cm => cm.indentLine(cm.getCursor().line),
        "Ctrl-G": cm => send_data('kill', 'SIGINT'),
        "Alt-Z": cm => highlight_expr() || eval_selection(),
        "Alt-O": eval_everything,
        "Ctrl-X": highlight_expr,
        "Ctrl-E": eval_selection,
        "Ctrl-C": cm => send_data('kill', 'SIGQUIT')
    })
});

function eval_everything() {
    const everything = editor.getValue();
    if (everything) eval_editor(everything, getEnd(editor));
}

function eval_selection() {
    const selection = editor.getSelection();
    if (selection) eval_editor(selection, editor.getCursor());
}

function highlight_expr() {
    const selection = get_expr(editor.getCursor());
    if (selection) editor.setSelection(selection.start, selection.end, {scroll: true});
}

function get_expr(position) {
    let {line, ch} = position;
    let first = true;
    while (line > -1) {
        const tokens = editor.getLineTokens(line);
        while (tokens && tokens.length > 0) {
            const token = tokens.pop();
            if (token.start < ch && token.state.depth === 0) {
                if (!first) {
                    const start = {line, ch: token.start}, end = {line, ch: token.end};
                    if (token.type === 'bracket') return get_paren_block(start);
                    else if (token.type === 'string') start.ch--;
                    return {start, end};
                }
            } else first = false;
        }
        ch = Infinity;
        line--;
    }
    return false;
}

function get_paren_block(position) {
    const parens = editor.findMatchingBracket(position);
    if (parens && parens.match) {
        const start = parens.forward ? parens.from : parens.to;
        const end = parens.forward ? parens.to : parens.from;
        end.ch += 1;
        editor_position = {line: end.line + 1, ch: 0};
        if (editor_position.line >= editor.lineCount()) editor.replaceRange('\n', end, end);
        editor.setCursor(editor_position);
        editor.scrollIntoView();
        return {start, end}
    } else return false;
}

function eval_editor(value, position) {
    editor_position = position;
    const length = value.length;
    if (value.substring(length - 1, length) !== '\n') value += '\n';
    push_repl(value, true);
}

function pad_string(string) {
    while (string.substring(0, 1) === '\n') string = string.substring(1);
    while (string.substring(string.length - 1) === '\n') string = string.substring(0, string.length - 1);
    return `\n${string}\n`;
}

function push_editor(string) {
    if (editor_position) {
        editor.replaceRange(pad_string(string), editor_position, editor_position);
        editor.setCursor(editor_position = editor.getCursor());
        editor_position = false;
    }
}