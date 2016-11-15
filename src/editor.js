/**
 * Created by joel on 8/20/16.
 */

import CodeMirror from 'codemirror';
import {defaults, strip_string, state} from './utils';
import {Expression, modes} from './expression';
import {send} from './connect';
import {keywords} from './keywords';

const marks = [];

const editor = CodeMirror(document.getElementById('editor'), {
    mode: 'scheme',
    theme: defaults.theme,
    styleActiveLine: true,
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: defaults.keyMap,
    value: ';;;; Lambda v0.1\n\n',
    extraKeys: CodeMirror.normalizeKeyMap({
        'Tab': cm => view(cm, 1) || hint(cm) || cm.execCommand('indentMore'),
        'Shift-Tab': cm => view(cm, -1) || cm.execCommand('indentLess'),
    })
});

editor.setCursor(2, 0);

CodeMirror.commands.eval_document = eval_document;
CodeMirror.commands.eval_expression = eval_expression;
CodeMirror.registerHelper('hintWords', 'scheme', keywords);

function earlier(a, b) { return a.line <= b.line }
function later(a, b) { return a.line >= b.line }
function range(a, b, c) { return later(b, a) && earlier(b, c) }
function hint(cm) {
    const start = cm.getCursor('from');
    const end = cm.getCursor('to');
    if (start.line === end.line && start.ch === end.ch && /^ *$/.test(cm.getLine(start.line).substring(0, start.ch))) return false;
    cm.showHint();
    return true;
}

function view(cm, delta) {
    const start = editor.getCursor('from');
    const end = editor.getCursor('to');
    const update = ({from, to}) => range(start, from, end) || range(start, to, end);

    const updates = marks.filter(mark => update(mark.find() || {from: -1, to: -1}));
    if (updates.length === 0) return false;
    const index = Math.abs((updates[0].expression.index + delta) % modes.length);
    updates.forEach(mark => mark.expression.update(index) && mark.changed());
    return true;
}

const complain_notification = document.createElement('span');
complain_notification.textContent = 'Resolve error before continuing evaluation';
function complain() {

}

function eval_expression(cm) {
    if (state.error) editor.openNotification(complain_notification, {duration: 3000});
    else {
        const position = editor.getCursor();
        const {start, end} = get_outer_expression(editor, position);
        const value = editor.getRange(start, end);
        state.expressions = false;
        eval_editor(value, end);
    }
}

function eval_document(cm) {
    if (state.error) editor.openNotification(complain_notification, {duration: 3000});
    else {
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
        } else state.expressions = false;
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
    if (state.error) {

    } else {
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
}

function error([text, restarts]) {
    const div = document.createElement('div');
    const h4 = document.createElement('h4');
    h4.textContent = text;
    div.appendChild(h4);
    div.className = 'error-panel';
    const ul = document.createElement('ul');
    div.appendChild(ul);
    const panel = editor.addPanel(div, {position: 'bottom'});
    const last = editor.lastLine();
    editor.setOption('readOnly', 'nocursor');
    state.error = e => {
        panel.clear();
        editor.setOption('readOnly', false);
        editor.focus();
        state.error = false;
    };
    restarts.forEach(([name, report], index) => {
        const li = document.createElement('li');
        const action = document.createElement('span');
        action.textContent = report;
        const button = document.createElement('input');
        button.type = 'button';
        button.value = name;
        button.onclick = e => {
            send('eval', '(restart ' + (restarts.length - index) + ')\n');
            if (name === 'use-value' || name === 'store-value') {
                button.type = 'text';
                button.value = '';
                button.style.fontStyle = 'normal';
                button.style.fontWeight = 'normal';
                button.onclick = e => e;
                button.onkeydown = e => {
                    if (e.keyCode === 13) {
                        send('eval', button.value + '\n');
                        state.error();
                    }
                }
            } else {
                state.error();
                if (name === 'abort') state.expressions = false;
            }
        };
        li.appendChild(button);
        li.appendChild(action);
        ul.appendChild(li);
        if (index === 0) button.focus();
    });
    panel.changed();
}

export {editor, push, view, error}