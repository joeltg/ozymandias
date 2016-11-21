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

function restart(input, name, index) {
    if (name === 'use-value' || name === 'store-value') return function() {
        state.expressions = false;
        input.type = 'text';
        input.value = '';
        input.style.fontStyle = 'normal';
        input.style.cursor = 'auto';
        input.onclick = e => e;
        input.onkeydown = e => {
            if (e.keyCode === 13) {
                send('eval', `(define *restart* (global-restart ${index}))\n(*restart* ${input.value})\n`);
                clear();
            }
        }
    };
    else return function() {
        state.expressions = false;
        send('eval', `((global-restart ${index}))\n`);
        clear();
    };
}

function error([text, restarts]) {
    const div = document.createElement('div'), h4 = document.createElement('h4'), ul = document.createElement('ul');
    div.appendChild(h4);
    div.appendChild(ul);
    h4.textContent = text;
    div.className = 'error-panel';
    const panel = editor.addPanel(div, {position: 'bottom'});
    editor.setOption('readOnly', 'nocursor');
    state.error = () => clear(panel);
    restarts.forEach(([name, report], index) => {
        const li = document.createElement('li'), span = document.createElement('span'), input = document.createElement('input');
        span.textContent = report;
        input.type = 'button';
        input.value = name;
        input.onclick = restart(input, name, index);
        li.appendChild(input);
        li.appendChild(span);
        ul.appendChild(li);
        if (index === 0) input.focus();
    });
    panel.changed();
}

export {error};