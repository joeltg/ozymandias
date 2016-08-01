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
        "Meta-P": e => e,
        "Meta-N": e => e,
        "Up": 'goLineUp',
        "Down": 'goLineDown'
    })
});

editor.settings = {
    name: 'editor',
    labels: {
        'eval-selection': {
            emacs: 'Meta-X R',
            sublime: 'Ctrl-Shift-Enter'
        },
        'eval-expression': {
            emacs: 'Meta-X D',
            sublime: 'Ctrl-Enter'
        },
        'eval-document': {
            emacs: 'Meta-X B',
            sublime: 'Ctrl-A-Enter'
        }
    },
    state: 'settings',
    theme: 'monokai',
    keyMap: 'emacs'
};

CodeMirror.commands.eval_selection = eval_selection;
CodeMirror.commands.eval_document = eval_document;
CodeMirror.commands.eval_expression = eval_expression;


function eval_expression(cm) {
    if (cm !== editor) return;
    const position = editor.getCursor();
    const {start, end} = get_outer_expression(editor, position);
    const value = editor.getRange(start, end);
    eval_editor(value, end);
}

function eval_document(cm) {
    if (cm !== editor) return;
    const everything = editor.getValue();
    if (everything) eval_editor(everything, getEnd(editor));
}

function eval_selection(cm) {
    if (cm !== editor) return;
    const selection = editor.getSelection();
    if (selection) eval_editor(selection, editor.getCursor());
}

const traverse_tokens = (predicate, callback) => (cm, {line, ch}) => {
    let tokens = cm.getLineTokens(line);
    for (tokens = tokens.filter(token => token.start < ch); line > -1; tokens = cm.getLineTokens(--line))
        for (let i = tokens.length - 1; i > -1; i--) if (predicate(tokens[i])) return callback(line, tokens[i]);
};

function select_expression(line, token) {
    const start = {line, ch: token.start}, end = {line, ch: token.end};
    if (token.type === 'bracket') return get_paren_block(end);
    else if (token.type === 'string') start.ch -= 1;
    return {start, end};
}

const get_outer_expression = traverse_tokens(token => token.state.depth === 0, select_expression);

function get_paren_block(position, callback) {
    const parens = editor.findMatchingBracket(position);
    if (parens && parens.match) {
        const start = parens.forward ? parens.from : parens.to;
        const end = parens.forward ? parens.to : parens.from;
        end.ch += 1;
        editor_position = {line: end.line + 1, ch: 0};
        // if (editor_position.line >= editor.lineCount()) editor.replaceRange('\n', end, end);
        editor.setCursor(editor_position);
        editor.scrollIntoView();
        return {start, end}
    } else return false;
}

function eval_editor(value, position) {
    editor_position = position;
    push_repl(strip_string(value) + '\n', true);
}

function push_editor(string) {
    if (editor_position) {
        editor.replaceRange(`\n${strip_string(string)}\n`, editor_position, editor_position);
        editor.setCursor(editor_position = editor.getCursor());
        editor_position = false;
    }
}