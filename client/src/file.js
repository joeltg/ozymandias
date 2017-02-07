/**
 * Created by joelg on 1/29/17.
 */

import {send} from './connect';
import {state, defaults} from './utils';
import {editor} from './editor/editor';

const name = 'Lambda';
const filename = document.getElementById('filename');
const login = document.getElementById('login');

function get_pathname({user, file}) {
    return (user ? '/users/' + user : '') + (file ? '/files/' + file : '');
}

function get_title({user, file, clean}) {
    const title = (user ? '/' + user : '') + (file ? '/' + file : '');
    return (title + ((!clean && title) ? ' ∙' : '')) || name;
}

function set_filename() {
    state.clean = editor.isClean();
    if (window.auth === '') {
        login.href = '/';
        login.textContent = '';
        login.style.display = 'none';
    } else if (window.user) {
        login.href = '/logout';
        login.textContent = 'Logout';
    } else {
        login.href = '/login';
        login.textContent = window.auth + ' login';
    }

    const title = get_title(state);
    filename.textContent = title;
    document.title = title;
}

set_filename();

let dialog = false;

window.onpopstate = function(event) {
    const {text} = defaults;
    const pathname = location.pathname.split('/');
    if (event.state && event.state.file) {
        move(state.file = event.state.file, false);
    } else if (pathname[0] !== 'files' && pathname[2] !== 'files') {
        load({file: null, text});
    }
};

function move(file, push) {
    if (push) {
        state.file = file;
        const pathname = get_pathname(state);
        const title = get_title(state);
        history.pushState({file}, title, pathname);
    }
    send('load', file);
    if (dialog) dialog();
    dialog = false;
}

function make(file) {
    const button = document.createElement('button');
    button.textContent = file;
    button.addEventListener('click', e => move(file, true));
    open_files.appendChild(button);
}

function open(files) {
    open_files.innerHTML = '';
    files.forEach(make);
    if (files.length === 0) open_files.textContent = 'No files found';
    input.focus();
}

function load({file, text}) {
    state.file = file;
    editor.setValue(text || '');
    editor.clearHistory();
    editor.markClean();
    set_filename();
    editor.focus();
}

const save_notification = document.createElement('span');
function save({error, name}) {
    if (error) save_notification.textContent = 'Save failed';
    else save_notification.textContent = 'Saved successfully';
    editor.openNotification(save_notification, {duration: 3000});
    state.file = name;
    set_filename();
}

const open_dialog = document.createElement('div');
open_dialog.className = 'prompt';
const open_prompt = document.createElement('div');
const open_label = document.createElement('span');
const open_files = document.createElement('span');
open_label.textContent = 'Open file: ';
open_prompt.appendChild(open_label);
open_prompt.appendChild(open_files);

const new_prompt = document.createElement('div');
const new_label = document.createElement('span');
const input = document.createElement('input');
new_label.textContent = 'New file: ';
input.type = 'text';
input.placeholder = 'Enter filename';
input.addEventListener('keydown', e => e.keyCode === 13 && move(input.value, true));
new_prompt.appendChild(new_label);
new_prompt.appendChild(input);

open_dialog.appendChild(new_prompt);
open_dialog.appendChild(open_prompt);
function cm_open(cm) {
    if (dialog) dialog();
    send('open', true);
    dialog = cm.openNotification(open_dialog, {duration: 0});
}

const dialogText = 'Unsaved changes will be lost!';
window.onbeforeunload = function(e) {
    if (editor.isClean() || !state.file) {
        return null;
    } else {
        e.returnValue = dialogText;
        return dialogText;
    }
};

editor.on('change', cm => state.file && (state.clean !== editor.isClean()) && set_filename());

const save_prompt = document.createElement('span');
save_prompt.textContent = 'Save file: /files/';
const save_input = document.createElement('input');
save_input.type = 'text';
save_prompt.appendChild(save_input);

function send_save() {
    if (save_input.value) {
        const name = save_input.value;
        const text = editor.getValue();
        state.file = name;
        send('save', {name, text});
    }
}

function onInput(event, value) {
    save_input.value = value.split('/').join('');
}

function cm_save(cm) {
    if (!cm.isClean()) {
        if (state.file) save_input.value = state.file;
        editor.markClean();
        set_filename();
        cm.openDialog(save_prompt, send_save, {onInput});
    }
}

document.addEventListener('keydown', function(e) {
    if (e.keyCode === 27) {
        if (dialog) {
            dialog();
            dialog = false;
        } else if (state.error) {
            editor.execCommand('interrupt');
        }
        editor.focus();
    } else if (e.keyCode === 9) {
        if (state.error) {
            const {length, inputs, index} = state.error;
            const i = (index + length + (e.shiftKey ? -1 : 1)) % length;
            inputs[i].input.focus();
            inputs[state.error.index].row.classList.remove('focus');
            inputs[i].row.classList.add('focus');
            state.error.index = i;
            e.preventDefault();
        }
    }
});

export {cm_save, cm_open, open, save, load};
