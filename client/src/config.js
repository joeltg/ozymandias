/**
 * Created by joel on 8/20/16.
 */

import {send} from './connect';
import {editor, editor_element} from './editor';
import {state, defaults} from './utils';
import CodeMirror from 'codemirror';
const mac = CodeMirror.keyMap["default"] == CodeMirror.keyMap.macDefault;
const ctrl = mac ? "Cmd-" : "Ctrl-";

const print_open = "#|";
const print_close = "|#";

const icon_elements = [];
const icon_collection = document.getElementsByClassName('icon');
for (let i = 0; icon_collection[i]; i++) icon_elements.push(icon_collection[i]);
const icons = {
    settings: {
        'monokai': document.getElementById('icon-settings-white'),
        'default': document.getElementById('icon-settings-black')
    },
    close: {
        'monokai': document.getElementById('icon-close-white'),
        'default': document.getElementById('icon-close-black')
    }
};
const hint = document.getElementById('hint');
const labels = [
    {
        element: document.getElementById('eval-expression'),
        emacs: 'Ctrl-X Ctrl-E',
        sublime: ctrl + 'Enter'
    },
    {
        element: document.getElementById('eval-document'),
        emacs: 'Ctrl-X Ctrl-A',
        sublime: ctrl + 'Shift-Enter'
    },
    {
        element: document.getElementById('view'),
        emacs: 'Tab',
        sublime: 'Tab'
    },
    {
        element: document.getElementById('autocomplete'),
        emacs: 'Meta-/',
        sublime: 'Alt-/'
    },
    {
        element: document.getElementById('open'),
        emacs: 'Ctrl-X F',
        sublime: ctrl + 'O'
    },
    {
        element: document.getElementById('save'),
        emacs: 'Ctrl-X S',
        sublime: ctrl + 'S'
    },
    {
        element: document.getElementById('interrupt'),
        emacs: 'Ctrl-C',
        sublime: ctrl + 'B'
    },
    {
        element: document.getElementById('help'),
        emacs: 'Meta-H',
        sublime: ctrl + 'Shift-H'
    }
];

labels.forEach(({element}) => element.parentNode.onclick = e => editor.execCommand(element.id));

function set_theme(theme) {
    state.theme = theme;
    icon_elements.forEach(element => element.style.visibility = 'hidden');
    icons[state.visibility][theme].style.visibility = 'visible';
    editor.setOption('theme', theme);
}

function set_visibility(visibility) {
    state.visibility = visibility;
    if (visibility === 'settings') {
        hint.style.display = 'none';
        editor_element.style.right = 0;
    }
    else if (visibility === 'close') {
        hint.style.display = 'block';
        editor_element.style.right = 320;
    }
    icon_elements.forEach(element => element.style.visibility = 'hidden');
    icons[visibility][state.theme].style.visibility = 'visible';
}

function help() {
    const visibility = (state.visibility === 'close' ? 'settings' : 'close');
    set_visibility(visibility);
    editor.focus();
}

function set_keyMap(keyMap) {
    labels.forEach(label => label.element.textContent = label[keyMap]);
    editor.setOption('keyMap', keyMap);
}

document.getElementById('icons').onclick = help;
document.getElementById('keyMap-emacs').onclick = e => set_keyMap('emacs');
document.getElementById('keyMap-sublime').onclick = e => set_keyMap('sublime');
document.getElementById('theme-light').onclick = e => set_theme('default');
document.getElementById('theme-dark').onclick = e => set_theme('monokai');
set_visibility(defaults.visibility);
set_keyMap(defaults.keyMap);
set_theme(defaults.theme);

editor.focus();

const filename = document.getElementById('filename');
const login = document.getElementById('login');
function set_filename(changed) {
    const {user, file} = state;
    if (user) {
        login.href = '/logout';
        login.textContent = 'Logout';
    } else {
        login.href = '/login';
        login.textContent = 'Login';
    }
    const title = (user || 'Lambda') + (file ? ': ' + file : '') + (changed ? ' ∙' : '');
    filename.textContent = title;
    document.title = title;
    history.replaceState({}, title, location.host + (user ? '/users/' + user : '/') + (file ? '/files/' + file : ''));
}

set_filename();

let clean = true;
let dialog = false;

const dialogText = 'Unsaved changes will be lost!';
window.onbeforeunload = function(e) {
    if (clean || !state.file) return null;
    e.returnValue = dialogText;
    return dialogText;
};

editor.on('change', function(cm, change) {
    if (state.file && !cm.isClean() && clean) {
        set_filename(true);
        clean = false;
    }
});


function move(file) {
    editor.clearHistory();
    // const path = location.pathname.split('/');
    // if (path && path.pop() && path.pop() === 'files') history.pushState({}, file, file);
    // else history.pushState({}, file, 'files/' + file);
    // history.replaceState({}, file, file);
    state.file = file;
    send('load', {file});
    if (dialog) dialog();
    dialog = false;
}

function make(file) {
    const button = document.createElement('button');
    button.textContent = file;
    button.addEventListener('click', e => move(file));
    open_files.appendChild(button);
}

function open(files) {
    open_files.innerHTML = '';
    files.forEach(make);
    if (files.length === 0) open_files.textContent = 'No files found';
    input.focus();
}

function load(data) {
    editor.setValue(data || '');
    editor.markClean();
    set_filename();
    clean = true;
    editor.focus();
}

const save_notification = document.createElement('span');
function save(data) {
    if (data) save_notification.textContent = 'Saved successfully';
    else save_notification.textContent = 'Save failed';
    editor.openNotification(save_notification, {duration: 3000});
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
input.addEventListener('keydown', e => e.keyCode === 13 && move(input.value));
new_prompt.appendChild(new_label);
new_prompt.appendChild(input);

open_dialog.appendChild(new_prompt);
open_dialog.appendChild(open_prompt);
function cm_open(cm) {
    if (dialog) dialog();
    send('open', true);
    dialog = cm.openNotification(open_dialog, {duration: 0});
}

const save_prompt = document.createElement('span');
save_prompt.textContent = 'Save file: /files/';
const save_input = document.createElement('input');
save_input.type = 'text';
save_prompt.appendChild(save_input);

const test = text =>
    (text.substring(0, print_open.length) !== print_open ||
    (text.substring(text.length - print_close.length, text.length) !== print_close));

function send_save() {
    if (save_input.value) {
        const name = save_input.value;
        const text = editor.getValue();
        state.file = name;
        set_filename(name);
        clean = true;
        editor.markClean();
        send('save', {name, text});
    }
}

function onInput(event, value) {
    save_input.value = value.split('/').join('');
}

function cm_save(cm) {
    if (!cm.isClean()) {
        if (state.file) save_input.value = state.file;
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
export {cm_open, cm_save, open, save, load, help, set_visibility, test}
