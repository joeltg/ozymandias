/**
 * Created by joel on 8/20/16.
 */

import CodeMirror from 'codemirror';
import {defaults, state, test} from '../utils';
import {Expression} from '../graphics/expression';
import {send} from '../connect';
import {keywords} from './keywords';

let id = 0;
const get = () => id++;
const handles = {};
const prefix = '#; ';
let highlight = null;

function tab(sign) {
    const direction = sign ? 1 : -1;
    const indentation = sign ? 'indentMore' : 'indentLess';
    return cm => cm_view(cm, direction) || cm.execCommand(indentation);
}

const editor_element = document.getElementById('editor');
const editor = CodeMirror(editor_element, {
    mode: 'scheme',
    theme: defaults.theme,
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: defaults.keyMap,
    value: defaults.text,
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

function find(line) {
    return Object.keys(handles).find(i => handles[i].lineNo() === line);
}

function cm_view(cm, delta) {
    const {line} = cm.getCursor();
    const i = find((cm.getLine(line) || !line) ? line : line - 1);
    if (i) {
        const {expression, mark} = handles[i];
        const radix = expression.modes.length;
        const index = (expression.index + delta + radix) % radix;
        mark.expression.update(index);
        mark.changed();
        return true;
    }
    return false;
}

function predicate({state: {depth, mode}, type}) {
    if (type === 'comment' || mode === 'comment' || mode === 's-expr-comment') return false;
    return depth === 0;
}

function find_next_expression(cm, {line, ch}) {
    const lines = cm.lineCount();
    for (let t = cm.getLineTokens(line).filter(({start}) => start > ch); line < lines; t = cm.getLineTokens(++line)) {
        for (let i = 0; i < t.length; i++) {
            const token = t[i];
            if (predicate(token)) {
                return {line, token};
            }
        }
    }
    return null;
}

function quoted({string, type, state: {depth, mode}}) {
    const quasi = (type === 'variable' && string === '`');
    const quote = (type === 'atom' && string === "'");
    return (quasi || quote) && (depth === 0) && (mode === false);
}

function find_previous_expression(cm, {line, ch}) {
    // father forgive me, for I know not what I do
    for (let t = cm.getLineTokens(line).filter(({start}) => start < ch); line >= 0; t = cm.getLineTokens(--line)) {
        for (let i = t.length - 1; i >= 0; i--) {
            const token = t[i];
            if (predicate(token)) {
                if (i > 0 && quoted(t[i - 1])) return {line, token: t[i - 1], next: token};
                else return {line, token};
            }
        }
    }
    return null;
}

function check_start_paren({start, end}) {
    const {line, ch} = start;
    const tokens = cm.getLineTokens(line);
    const index = tokens.findIndex(({start}) => start === ch);
    if (index > 0 && quoted(tokens[index - 1])) {
        return {start: {line, ch: tokens[index - 1].start}, end};
    } else {
        return {start, end}
    }
}

function select_expression(cm, line, token, next) {
    const start = {line, ch: token.start}, end = {line, ch: token.end};
    if (token.type === 'paren') {
        const parens = select_paren(end);
        if (token.string === '(') return parens;
        else return check_start_paren(parens);
    } else if (token.type === 'string') {
        const backward = select_string_backward(cm, token, start);
        const forward = select_string_forward(cm, token, end);
        return {start: backward, end: forward};
    } else if (quoted(token) && next) {
        return {start, end: select_expression(cm, line, next).end};
    } else {
        return {start, end};
    }
}

function select_string_forward(cm, {string}, end) {
    if (string[string.length - 1] === '"') {
        return end;
    } else {
        const next = find_next_expression(cm, end);
        if (next && next.token.type === 'string') {
            const {line, token} = next;
            return select_string_forward(cm, token, {line, ch: token.end});
        } else {
            return null;
        }
    }
}

function select_string_backward(cm, {string}, start) {
    if (string[0] === '"') {
        return start;
    } else {
        const prev = find_previous_expression(cm, start);
        if (prev && prev.token.type === 'string') {
            const {line, token} = prev;
            return select_string_backward(cm, token, {line, ch: token.start});
        } else {
            return null;
        }
    }
}

function select_paren(position) {
    const brackets = editor.findMatchingBracket(position);
    if (brackets && brackets.match) {
        const {forward, from, to} = brackets;
        const start = forward ? from : to;
        const end = forward ? to : from;
        end.ch += 1;
        return {start, end};
    } else {
        return null;
    }
}

function thing(cm) {
    if (highlight) highlight.clear();
    if (cm.somethingSelected()) {
        highlight = null;
    } else {
        const position = cm.getCursor();
        const previous = find_previous_expression(cm, position);
        if (previous) {
            const {line, token} = previous;
            const expression = select_expression(cm, line, token);
            if (expression) {
                const {start, end} = expression;
                if (start && end) {
                    highlight = cm.markText(start, end, {className: 'cm-ce'});
                    return highlight;
                }
            }
        }
        highlight = null;
    }
}

// editor.on('cursorActivity', thing);

function eval_expression(cm) {
    state.forward = false;
    const position = cm.getCursor();
    const previous = find_previous_expression(cm, position);
    if (previous) {
        const {line, token, next} = previous;
        const expression = select_expression(cm, line, token, next);
        if (expression) {
            const {start, end} = expression;
            if (start && end) {
                const value = cm.getRange(start, end);
                return evaluate(cm, value, end);
            }
        }
    }
    console.error('could not select expression');
}

function eval_document(cm) {
    const position = {line: 0, ch: 0};
    clear_values(cm);
    eval_forward(cm, position);
}

function evaluate(cm, value, position) {
    const {line} = position;
    const last = cm.lastLine();
    if (line === last) {
        cm.replaceRange('\n', position);
        state.position = {line: line + 1, ch: 0};
    } else if (test(cm.getLine(line + 1))) {
        if (line + 1 === last || cm.getLine(line + 1)) {
            cm.replaceRange('\n', position);
        }
        state.position = {line: line + 1, ch: 0};
    } else {
        let l = line + 1, t;
        while (l <= last) {
            t = cm.getLine(l);
            if (test(t)) break;
            l += 1;
        }
        cm.replaceRange('\n', position, {line: l});
        state.position = {line: line + 1, ch: 0};
    }

    cm.setCursor(state.position);

    send('eval', value.trim() + '\n', true);
}

function eval_forward(cm, position) {
    cm.setCursor(position);
    const next = find_next_expression(cm, position);
    if (next) {
        const {line, token} = next;
        const expression = select_expression(cm, line, token);
        if (expression) {
            const {start, end} = expression;
            if (start && end) {
                state.forward = true;
                const value = cm.getRange(start, end);
                return evaluate(cm, value, end);
            }
        }
    }
    state.forward = false;
}

function value({text, pretty, latex}) {
    print({text, pretty, latex});
    const {position, forward} = state;
    if (forward) {
        eval_forward(editor, position);
    }
}

function print({text, pretty, latex}) {
    const {position} = state;
    const {line} = position;

    const newline = editor.getLine(line) ? '\n' : '';
    editor.replaceRange(newline + prefix + text.trim() + '\n', position);

    state.position = editor.getCursor();

    if (pretty && pretty.trim() !== text) {
        const expression = new Expression(text, pretty, latex);
        const mark = editor.addLineWidget(state.position.line - 1, expression.node);
        const i = get();
        const handle = editor.addLineClass(mark.line, 'background', 'cm-e');
        handle.mark = mark;
        handle.expression = expression;
        expression.mark = mark;
        mark.expression = expression;

        handles[i] = handle;
        handle.on('delete', () => delete handles[i]);
    }

    editor.scrollIntoView();
}

function clear_values(cm) {
    const {line} = editor.getCursor();
    const lines = cm.getValue().split('\n');
    const end = test(lines[lines.length - 1]);
    const first = lines.slice(0, line).filter(test);
    const last = lines.slice(line).filter(test);
    const newLine = first.length;
    cm.setValue(first.concat(last).join('\n') + (end ? '' : '\n'));
    cm.setCursor(newLine);
    cm.focus();
}

export {editor, editor_element, value, print, cm_view}