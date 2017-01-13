/**
 * Created by joelg on 11/17/16.
 */

import {editor} from './editor';
import {state} from './utils';
import {send} from './connect';

function clear(panel) {
    panel.clear();
    editor.setOption('readOnly', false);
    editor.focus();
    state.error = false;
}

function restart(panel, input, arity, index) {
    state.expressions = false;
    if (arity > 0) return function() {
        if (state.error) state.error.open = false;
        input.type = 'text';
        input.value = '';
        input.style.fontStyle = 'normal';
        input.style.cursor = 'auto';
        input.onclick = e => e;
        input.onkeydown = e => {
            if (e.keyCode === 13) {
                send('eval', `(${index} ${input.value})\n`);
                clear(panel);
            }
        }
    };
    else return function() {
        send('eval', `(${index})\n`);
        clear(panel);
    };
}

function subproblem({env, exp}) {
    const li = document.createElement('li');

    const expression = document.createElement('code');
    expression.textContent = exp;
    li.appendChild(expression);

    if (env) {
        const environment = document.createElement('span');
        environment.textContent = env;
        li.appendChild(environment);
    }

    return li;
}

function error([text, restarts, stack]) {
    const div = document.createElement('div'),
        h2 = document.createElement('h2'),
        ss = document.createElement('h3'),
        rs = document.createElement('h3'),
        ul = document.createElement('ul'),
        ol = document.createElement('ol');
    div.appendChild(h2);
    ul.classList.add('subproblems');
    stack.map(subproblem).forEach(li => ul.appendChild(li));
    div.appendChild(ss);
    div.appendChild(ul);
    div.appendChild(rs);
    div.appendChild(ol);
    h2.textContent = text;
    ss.textContent = 'Subproblems';
    rs.textContent = 'Restarts';
    div.classList.add('panel');
    const inputs = restarts.map(function([name, report, arity]) {
        const li = document.createElement('li'),
            span = document.createElement('span'),
            input = document.createElement('input');
        span.textContent = report;
        input.type = 'button';
        input.value = name;
        li.appendChild(input);
        li.appendChild(span);
        ol.appendChild(li);
        return {arity, input};
    });
    const panel = editor.addPanel(div, {position: 'bottom'});
    editor.setOption('readOnly', 'nocursor');
    state.error = {
        clear: () => clear(panel),
        length: inputs.length,
        open: true,
        index: 0,
        inputs
    };
    inputs.forEach(({arity, input}, index) => input.onclick = restart(panel, input, arity, index));
    panel.changed();
    inputs[0].input.focus();
}

export {error};
