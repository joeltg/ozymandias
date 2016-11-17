/**
 * Created by joelg on 11/17/16.
 */

import {editor} from './editor';
import {state} from './utils';
import {send} from './connect';

function error([text, restarts]) {
    console.log(restarts.length, restarts);
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
            send('eval', `(global-restart ${index})\n`);
            if (name === 'use-value' || name === 'store-value') {
                button.type = 'text';
                button.value = '';
                button.style.fontStyle = 'normal';
                button.style.cursor = 'auto';
                button.onclick = e => e;
                button.onkeydown = e => {
                    if (e.keyCode === 13) {
                        send('eval', button.value + '\n');
                        state.error();
                    }
                }
            } else state.error();
            state.expressions = false;
        };
        li.appendChild(button);
        li.appendChild(action);
        ul.appendChild(li);
        if (index === 0) button.focus();
    });
    panel.changed();
}

export {error};