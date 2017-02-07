/**
 * Created by joelg on 11/17/16.
 */

import {editor} from '../editor/editor';
import {state} from '../utils';
import {send} from '../connect';

function clear(panel) {
    panel.clear();
    editor.setOption('readOnly', false);
    editor.focus();
    state.error = false;
    state.mode = null;
}

function restart(panel, index, value) {
    state.expressions = false;
    send('eval', `(${index} ${value})\n`);
    clear(panel);
}

function focus(index) {
    if (state.error && state.error.index !== index) {
        state.error.inputs[state.error.index].row.classList.remove('focus');
        state.error.inputs[index].row.classList.add('focus');
        state.error.index = index;
    }
}

function attachHandler(panel, input, arity, index) {
    if (arity > 0) {
        input.addEventListener('focus', e => focus(index));
        input.addEventListener('keydown', e => ((e.keyCode === 13) && input.value && restart(panel, index, input.value)));
    }
    else input.addEventListener('click', e => restart(panel, index, ''));
}

function subproblem({env, exp}, index) {
    const tr = dom('tr');
    tr.appendChild(dom('td', index.toString()));
    tr.appendChild(dom('td', dom('pre', exp || '')));
    tr.appendChild(dom('td', dom('pre', env || '')));
    return tr;
}

function dom(tag, content) {
    const element = document.createElement(tag);
    if (typeof content === 'string') element.textContent = content;
    else if (content instanceof HTMLElement) element.appendChild(content);
    return element;
}

function error([text, restarts, stack]) {
    const div = dom('div'), subproblemTable = dom('table'), restartTable = dom('table'), label = dom('tr');
    subproblemTable.classList.add('subproblems');
    restartTable.classList.add('restarts');
    label.appendChild(dom('th', 'Depth'));
    label.appendChild(dom('th', 'Expression'));
    label.appendChild(dom('th', 'Environment'));
    subproblemTable.appendChild(label);
    div.appendChild(dom('h2', text));
    div.appendChild(dom('h3', 'Subproblems'));
    div.appendChild(subproblemTable);
    div.appendChild(dom('h3', 'Restarts'));
    div.appendChild(restartTable);
    stack.map(subproblem).forEach(tr => subproblemTable.appendChild(tr));
    div.classList.add('panel');
    const inputs = restarts.map(function([name, report, arity]) {
        const row = dom('tr'), input = dom('input');

        if (arity > 0) {
            input.type = 'text';
            input.placeholder = name;
        } else {
            input.type = 'button';
            input.value = name;
        }

        row.appendChild(dom('td', input));
        row.appendChild(dom('td', report));

        restartTable.appendChild(row);
        return {arity, input, row};
    });
    const panel = editor.addPanel(div, {position: 'bottom'});
    editor.setOption('readOnly', 'nocursor');
    state.mode = 'error';
    state.error = {
        clear: () => clear(panel),
        length: inputs.length,
        index: 0,
        inputs
    };
    inputs.forEach(({arity, input}, index) => attachHandler(panel, input, arity, index));
    panel.changed();
    inputs[0].row.classList.add('focus');
    inputs[0].input.focus();
}

export {error};
