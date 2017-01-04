/**
 * Created by joelg on 11/17/16.
 */

import {editor} from './editor';
import {state} from './utils';
import {send} from './connect';
import {debug} from './debug';

function clear(panel) {
    panel.clear();
    editor.setOption('readOnly', false);
    editor.focus();
    state.error = false;
}

function restart(panel, inputs, index, name) {
    state.expressions = false;
    const input = inputs[index];
    if (name === 'debug') return function() {
        debug(inputs);
    };
    else if (name === 'use-value' || name === 'store-value') return function() {
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

function error([text, restarts]) {
    const div = document.createElement('div'), h2 = document.createElement('h2'), ul = document.createElement('ul');
    div.appendChild(h2);
    div.appendChild(ul);
    h2.textContent = text;
    div.classList.add('panel');
    div.classList.add('error-panel');
    restarts.push(['debug', 'Launch the debugger.']);
    const inputs = restarts.map(function([name, report], index) {
        const li = document.createElement('li'), span = document.createElement('span'), input = document.createElement('input');
        span.textContent = report;
        input.type = 'button';
        input.value = name;
        li.appendChild(input);
        li.appendChild(span);
        ul.appendChild(li);
        return input;
    });
    const panel = editor.addPanel(div, {position: 'bottom'});
    editor.setOption('readOnly', 'nocursor');
    state.error = () => clear(panel);
    restarts.forEach(([name, report], index) => inputs[index].onclick = restart(panel, inputs, index, name));
    panel.changed();
    inputs[0].focus();
}

export {error};
