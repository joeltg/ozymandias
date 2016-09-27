import CodeMirror from 'codemirror';
import {default_keyMap, default_state, default_theme, strip_string, get_end, state} from './utils';
import {push_repl} from './repl';
import {Expression, modes} from './expression';

const marks = [];

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
        'eval-expression': {
            emacs: 'Ctrl-X Ctrl-E',
            sublime: 'Ctrl-Enter'
        },
        'eval-document': {
            emacs: 'Ctrl-X Ctrl-A',
            sublime: 'Ctrl-A-Enter'
        },
        'open': {
            emacs: 'Ctrl-X F',
            sublime: 'Ctrl-O'
        },
        'save': {
            emacs: 'Ctrl-X S',
            sublime: 'Ctrl-S'
        }
    },
    state: default_state,
    theme: default_theme,
    keyMap: default_keyMap
};

CodeMirror.commands.eval_document = eval_document;
CodeMirror.commands.eval_expression = eval_expression;
let index = 0;

function toggle_view(cm) {
    if (cm !== editor) return;
    index = (index + 1) % modes.length;
    marks.forEach(mark => mark.find() && mark.expression.update(index) && mark.changed());
}

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

function push_editor({string, latex}) {
    const position = state.editor_position;
    if (position) {
        const expression = new Expression(string, latex);
        editor.setCursor(position);
        editor.replaceRange(`\n${string}\n`, position, position);
        state.editor_position = editor.getCursor();
        const mark = editor.markText(
            {line: position.line + 1, ch: 0},
            {line: state.editor_position.line - 1},
            {replacedWith: expression.node}
        );
        expression.mark = mark;
        mark.expression = expression;
        marks.push(mark);
    }
}

export {editor, push_editor, toggle_view}