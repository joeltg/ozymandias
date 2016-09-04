import CodeMirror from 'codemirror';
import {default_keyMap, default_state, default_theme, strip_string, get_end, state} from './utils';
import {push_repl} from './repl';

const editor_element = document.getElementById('editor');
const editor = CodeMirror(editor_element, {
    mode:  'scheme',
    theme: default_theme,
    styleActiveLine: true,
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: default_keyMap,
    extraKeys: CodeMirror.normalizeKeyMap({
        'Meta-P': e => e,
        'Meta-N': e => e,
        'Up': 'goLineUp',
        'Down': 'goLineDown'
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
    state: default_state,
    theme: default_theme,
    keyMap: default_keyMap
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
    if (everything) eval_editor(everything, get_end(editor));
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
        state.editor_position = {line: end.line + 1, ch: 0};
        // if (state.editor_position.line >= editor.lineCount()) editor.replaceRange('\n', end, end);
        editor.setCursor(state.editor_position);
        editor.scrollIntoView();
        return {start, end}
    } else return false;
}

function eval_editor(value, position) {
    state.editor_position = position;
    push_repl(strip_string(value) + '\n', true);
}

function push_editor(string) {
    if (state.editor_position) {
        editor.replaceRange(`\n${strip_string(string)}\n`, state.editor_position, state.editor_position);
        editor.setCursor(state.editor_position = editor.getCursor());
        state.editor_position = false;
    }
}

export {editor, push_editor}