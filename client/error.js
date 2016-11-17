/**
 * Created by joelg on 11/17/16.
 */

import {editor} from './editor';
import {state} from './utils';
import {send} from './connect';

function error([text, restarts]) {
    const div = document.createElement('div'), h4 = document.createElement('h4'), ul = document.createElement('ul');
    div.appendChild(h4);
    div.appendChild(ul);
    h4.textContent = text;
    div.className = 'error-panel';
    const panel = editor.addPanel(div, {position: 'bottom'});
    editor.setOption('readOnly', 'nocursor');
    function clear() {
        panel.clear();
        editor.setOption('readOnly', false);
        editor.focus();
        state.error = false;
    }
    state.error = clear;
    restarts.forEach(([name, report], index) => {
        const li = document.createElement('li'), span = document.createElement('span'), input = document.createElement('input');
        span.textContent = report;
        input.type = 'input';
        input.value = name;
        function restart() {
            state.expressions = false;
            if (name === 'use-value' || name === 'store-value') {
                input.type = 'text';
                input.value = '';
                input.style.fontStyle = 'normal';
                input.style.cursor = 'auto';
                input.onclick = e => e;
                input.onkeydown = e => {
                    if (e.keyCode === 13) {
                        send('eval', `(global-restart ${index})\n${input.value}\n`);
                        clear();
                    }
                }
            } else {
                send('eval', `(global-restart ${index})\n`);
                clear();
            }
        }
        input.onclick = restart;
        li.appendChild(input);
        li.appendChild(span);
        ul.appendChild(li);
        if (index === 0) input.focus();
    });
    panel.changed();
}

export {error};