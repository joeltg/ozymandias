/**
 * Created by joel on 8/20/16.
 */

import CodeMirror from 'codemirror';
import {defaults, strip, state, test} from '../utils';
import {Expression} from '../graphics/expression';
import {send} from '../connect';
import {keywords} from './keywords';

const marks = [];

function tab(sign) {
    const direction = sign ? 1 : -1;
    const indentation = sign ? 'indentMore' : 'indentLess';
    return cm => cm_view(cm, direction) || cm.execCommand(indentation);
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
    value: ';;;; Lambda v0.3\n\n',
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

function cm_view(cm, delta) {
    const {line} = cm.getCursor();
    const clear = cm.getLine(line) === '';
    const match = l => (l === line) || (clear && l === line - 1);
    const mark = marks.find(mark => match(cm.getLineNumber(mark.line)));
    if (mark) {
        const {expression} = mark;
        const radix = expression.modes.length;
        const index = (expression.index + delta + radix) % radix;
        mark.expression.update(index);
        mark.changed();
        return true;
    }
    return false;
}

function eval_expression(cm) {
    if (state.error) complain(cm);
    else {
        const position = cm.getCursor();
        const {start, end} = get_outer_expression(cm, position);
        const {line} = end;
        const value = cm.getRange(start, end);
        state.expressions = [];
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
        } else state.expressions = [];
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
    editor.setCursor(to);
    const text = editor.getRange(from, to);
    const {line} = to;
    evaluate(text, {line});
}

function value([text, pretty, latex]) {
    const {position, expressions} = state;

    const {line} = position;
    const nextLine = editor.getLine(line + 1);
    const nextNextLine = editor.getLine(line + 2);

    if (nextLine && !test(nextLine)) editor.replaceRange('\n\n', position, {line: line + 2});
    else if (nextLine || nextLine === undefined) editor.replaceRange('\n\n', position);
    else if (nextNextLine || nextNextLine === undefined) editor.replaceRange('\n', position);

    state.position = editor.getCursor();
    const start = {line: line + 1, ch: 0}, end = {line: line + 1};
    editor.replaceRange('#; ' + strip(text), start, end);

    const expression = new Expression(text, pretty, latex);
    const mark = editor.addLineWidget(line + 1, expression.node);
    editor.addLineClass(mark.line, 'background', 'cm-expression');
    expression.mark = mark;
    mark.expression = expression;
    marks.push(mark);
    editor.scrollIntoView();

    if (expressions.length > 0) pop_expression();
}

function clear_values(cm) {
    const {line} = editor.getCursor();
    const lines = cm.getValue().split('\n');
    const first = lines.slice(0, line).filter(test);
    const last = lines.slice(line).filter(test);
    const newLine = first.length;
    cm.setValue(first.concat(last).join('\n'));
    cm.setCursor(newLine);
    cm.focus();
}

export {editor, editor_element, value, cm_view}