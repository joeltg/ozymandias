/**
 * Created by joel on 8/20/16.
 */

import CodeMirror from 'codemirror';
import {defaults, strip, state} from '../utils';
import {Expression, modes} from '../graphics/expression';
import {send} from '../connect';
import {keywords} from './keywords';
import {test} from '../config';

const marks = [];

function tab(sign) {
    const direction = sign ? 1 : -1;
    const indentation = sign ? 'indentMore' : 'indentLess';
    return cm => view(cm, direction) || cm.execCommand(indentation);
}

const editor_element = document.getElementById('editor');
const editor = CodeMirror(editor_element, {
    mode: 'scheme',
    theme: defaults.theme,
    styleActiveLine: true,
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: defaults.keyMap,
    value: ';;;; Lambda v0.2\n\n',
    extraKeys: CodeMirror.normalizeKeyMap({
        'Tab': tab(true),
        'Shift-Tab': tab(false),
    })
});
window.cm = editor;
editor.setCursor(2, 0);
CodeMirror.commands['clear-values'] = clear_values;
CodeMirror.commands['eval-document']= eval_document;
CodeMirror.commands['eval-expression'] = eval_expression;
CodeMirror.registerHelper('hintWords', 'scheme', keywords.sort());

const complain_notification = document.createElement('span');

complain_notification.textContent = 'Resolve error before continuing evaluation';

function complain(cm) {
    cm.openNotification(complain_notification, {duration: 3000});
}

function range(a, b, c) {
    return (b.line >= a.line) && (b.line <= c.line);
}

function view(cm, delta) {
    const start = cm.getCursor('from');
    const end = cm.getCursor('to');
    const update = ({from, to}) => range(start, from, end) || range(start, to, end);

    const updates = marks.filter(mark => update(mark.find() || {from: -1, to: -1}));
    if (updates.length === 0) return false;
    const index = Math.abs((updates[0].expression.index + delta) % modes.length);
    updates.forEach(mark => mark.expression.update(index) && mark.changed());
    return true;
}

function eval_expression(cm) {
    if (state.error) complain(cm);
    else {
        const position = cm.getCursor();
        const {start, end} = get_outer_expression(cm, position);
        const {line} = end;
        const value = cm.getRange(start, end);
        state.expressions = false;
        evaluate(value, {line});
    }
}

function eval_document(cm) {
    if (state.error) complain(cm);
    else {
        const expressions = [];
        let open = false;
        cm.eachLine(line_handle => {
            if (test(line_handle.text)) {
                const line = cm.getLineNumber(line_handle);
                const tokens = cm.getLineTokens(line);
                tokens.forEach(token => {
                    const {start, end, type, state: {depth, mode}} = token;
                    if (depth === 0 && mode !== 'comment') {
                        if (type === 'bracket') {
                            if (open) {
                                expressions.push({start: open, end: {line: line_handle, ch: end}});
                                open = false;
                            } else open = {line: line_handle, ch: start};
                        } else if (type === 'comment') {

                        } else expressions.push({start: {line: line_handle, ch: start}, end: {line: line_handle, ch: end}});
                    }
                });
            }
        });
        if (expressions.length > 0) {
            state.expressions = expressions;
            pop_expression();
        } else state.expressions = false;
    }
}

function select_expression(line, token) {
    const start = {line, ch: token.start}, end = {line, ch: token.end};
    if (token.type === 'bracket') return get_paren_block(end, token);
    else if (token.type === 'string') start.ch -= 1;
    return {start, end};
}

// father forgive me, for I know not what I do
function get_outer_expression(cm, {line, ch}) {
    let tokens = cm.getLineTokens(line);
    for (tokens = tokens.filter(token => token.start < ch); line > -1; tokens = cm.getLineTokens(--line)) {
        for (let i = tokens.length - 1; i > -1; i--) {
            if (tokens[i].state.depth === 0 && tokens[i].type !== 'comment' && tokens[i].state.mode !== 'comment') {
                return select_expression(line, tokens[i]);
            }
        }
    }
}

function get_paren_block(position, token) {
    const parens = editor.findMatchingBracket(position);
    if (parens && parens.match) {
        const start = parens.forward ? parens.from : parens.to;
        const end = parens.forward ? parens.to : parens.from;
        if ((token.string === '[' || token.string === ']') && editor.getLine(start.line)[start.ch - 1] === '#') start.ch -= 1;
        end.ch += 1;
        state.position = {line: end.line + 1, ch: 0};
        editor.setCursor(state.position);
        editor.scrollIntoView();
        return {start, end}
    } else return false;
}

function evaluate(value, position) {
    state.position = position;
    send('eval', strip(value) + '\n', true);
}

function pop_expression() {
    const [{start, end}] = state.expressions.splice(0, 1);
    const from = {line: editor.getLineNumber(start.line), ch: start.ch};
    const to = {line: editor.getLineNumber(end.line), ch: end.ch};
    const text = editor.getRange(from, to);
    const {line} = to;
    evaluate(text, {line});
}


function value([text, latex]) {
    if (state.error) {
        console.error(text, latex);
    } else {
        const {position} = state;
        if (position) {
            editor.setCursor(position);
            const line = position.line + 1;
            const nextLine = editor.getLine(line);
            const nextNextLine = editor.getLine(line + 1);

            if (nextLine && !test(nextLine)) editor.replaceRange('\n\n', position, {line: line + 1});
            else if (nextLine || nextLine === undefined) editor.replaceRange('\n\n', position);
            else if (nextNextLine || nextNextLine === undefined) editor.replaceRange('\n', position);
            state.position = editor.getCursor();

            const start = {line, ch: 0}, end = {line};
            editor.replaceRange(strip(text), start, end);

            if (latex) {
                const expression = new Expression(text, latex, defaults.mode_index);
                const mark = editor.markText(start, end, {
                    replacedWith: expression.node,
                    inclusiveLeft: false,
                    inclusiveRight: true
                });
                expression.mark = mark;
                mark.expression = expression;
                marks.push(mark);
            } else {
                const element = document.createElement('span');
                element.textContent = strip(text);
                element.className = 'cm-comment';

                editor.markText(start, end, {
                    replacedWith: element,
                    inclusiveLeft: false,
                    inclusiveRight: true
                });
            }
        }
        if (state.expressions && state.expressions.length > 0) pop_expression();
    }
}

function clear_values(cm) {
    cm.setValue(cm.getValue().split('\n').filter(test).join('\n'));
    cm.focus();
}

export {editor, editor_element, value, view}