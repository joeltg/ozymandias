/**
 * Created by joel on 8/20/16.
 */

import CodeMirror from 'codemirror';
import {defaults, strip_string, state} from './utils';
import {Expression, modes} from './expression';
import {send} from './connect';

const marks = [];

const editor = CodeMirror(document.getElementById('editor'), {
    mode:  'scheme',
    theme: defaults.theme,
    styleActiveLine: true,
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: defaults.keyMap,
    value: ';;;; Lambda v0.1\n'
});

editor.setCursor(1, 0);

CodeMirror.commands.eval_document = eval_document;
CodeMirror.commands.eval_expression = eval_expression;

function earlier(a, b) { return a.line <= b.line }
function later(a, b) { return a.line >= b.line }
function range(a, b, c) { return later(b, a) && earlier(b, c) }

function view(cm) {
    if (cm !== editor) return;

    const start = editor.getCursor('from');
    const end = editor.getCursor('to');
    const update = ({from, to}) => range(start, from, end) || range(start, to, end);

    const updates = marks.filter(mark => update(mark.find() || {from: -1, to: -1}));
    if (updates.length > 0) {
        const index = (updates[0].expression.index + 1) % modes.length;
        updates.forEach(mark => mark.expression.update(index) && mark.changed());
    }
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

    const expressions = [];

    let open = false;
    editor.eachLine(line_handle => {
        const line = editor.getLineNumber(line_handle);
        const tokens = editor.getLineTokens(line);
        tokens.forEach(token => {
            const {start, end, type, state: {depth, mode}} = token;
            if (depth === 0 && mode !== 'comment') {
                if (type === 'bracket') {
                    if (open) {
                        expressions.push({start: open, end: {line_handle, end}});
                        open = false;
                    } else open = {line_handle, start};
                } else if (type === 'comment') {

                } else expressions.push({start: {line_handle, start}, end: {line_handle, end}});
            }
        });
    });
    if (expressions.length > 0) {
        state.expressions = expressions;
        pop_expression();
    }
}

const traverse_tokens = (predicate, callback) => (cm, {line, ch}) => {
    let tokens = cm.getLineTokens(line);
    for (tokens = tokens.filter(token => token.start < ch); line > -1; tokens = cm.getLineTokens(--line))
        for (let i = tokens.length - 1; i > -1; i--)
            if (predicate(tokens[i]))
                return callback(line, tokens[i]);
};

function select_expression(line, token) {
    const start = {line, ch: token.start}, end = {line, ch: token.end};
    if (token.type === 'bracket') return get_paren_block(end);
    else if (token.type === 'string') start.ch -= 1;
    return {start, end};
}

const get_outer_expression = traverse_tokens(token => token.state.depth === 0, select_expression);

function get_paren_block(position) {
    const parens = editor.findMatchingBracket(position);
    if (parens && parens.match) {
        const start = parens.forward ? parens.from : parens.to;
        const end = parens.forward ? parens.to : parens.from;
        end.ch += 1;
        state.position = {line: end.line + 1, ch: 0};
        editor.setCursor(state.position);
        editor.scrollIntoView();
        return {start, end}
    } else return false;
}

function eval_editor(value, position) {
    state.position = position;
    send('eval', strip_string(value) + '\n', true);
}

function pop_expression() {
    const [{start, end}] = state.expressions.splice(0, 1);
    const from = {line: editor.getLineNumber(start.line_handle), ch: start.start};
    const to = {line: editor.getLineNumber(end.line_handle), ch: end.end};
    const text = editor.getRange(from, to);
    eval_editor(text, to);
}

function push([text, latex, flex]) {
    const {position} = state;
    if (position) {
        editor.setCursor(position);
        editor.replaceRange(`\n${text}\n`, position, position);
        state.position = editor.getCursor();
        if (latex) {
            const expression = new Expression(text, latex, defaults.mode_index);
            const mark = editor.markText(
                {line: position.line + 1, ch: 0},
                {line: state.position.line - 1},
                {replacedWith: expression.node}
            );
            expression.mark = mark;
            mark.expression = expression;
            marks.push(mark);
        }
        if (flex) {
            const [id, args, vals, out] = flex;
        }
    }
    if (state.expressions && state.expressions.length > 0) pop_expression();
}

export {editor, push, view}