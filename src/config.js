/**
 * Created by joel on 8/20/16.
 */

import {send} from './connect';
import {editor, editor_element} from './editor';
import {state, defaults, stdout} from './utils';

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
        sublime: 'Ctrl-Enter'
    },
    {
        element: document.getElementById('eval-document'),
        emacs: 'Ctrl-X Ctrl-A',
        sublime: 'Ctrl-Shift-Enter'
    },
    {
        element: document.getElementById('view'),
        emacs: 'Tab',
        sublime: 'Tab'
    },
    {
        element: document.getElementById('open'),
        emacs: 'Ctrl-X F',
        sublime: 'Ctrl-O'
    },
    {
        element: document.getElementById('save'),
        emacs: 'Ctrl-X S',
        sublime: 'Ctrl-S'
    },
    // {
    //     element: document.getElementById('previous'),
    //     emacs: 'Meta-P',
    //     sublime: 'Up'
    // },
    // {
    //     element: document.getElementById('next'),
    //     emacs: 'Meta-N',
    //     sublime: 'Down'
    // },
    {
        element: document.getElementById('interrupt'),
        emacs: 'Ctrl-C',
        sublime: 'Ctrl-B'
    },
    // {
    //     element: document.getElementById('debug'),
    //     emacs: 'Ctrl-I',
    //     sublime: 'Ctrl-E'
    // },
    {
        element: document.getElementById('help'),
        emacs: 'Meta-H',
        sublime: 'Alt-H'
    }
];

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
function set_filename(name) {
    document.title = 'Lambda: ' + name;
    filename.textContent = name;
}

let clean = true;
let dialog = false;

editor.on('change', function(cm, change) {
    if (state.filename && !cm.isClean() && clean) {
        set_filename(state.filename + ' ●');
        clean = false;
    }
});

function open(files) {
    open_files.innerHTML = '';
    files.forEach(function(name, index) {
        const button = document.createElement('button');
        button.textContent = name;
        button.addEventListener('click', function(e) {
            if (dialog) dialog();
            dialog = false;
            state.filename = name;
            send('load', {name});
        });
        open_files.appendChild(button);
        if (index === 0) button.focus();
    });
    if (files.length === 0) open_files.textContent = 'No files found';
}

function load(data) {
    editor.setValue(data || '');
    editor.markClean();
    set_filename(state.filename);
    clean = true;
    editor.focus();
}

const save_notification = document.createElement('span');
function save(data) {
    if (data) save_notification.textContent = 'Saved successfully';
    else save_notification.textContent = 'Save failed';
    editor.openNotification(save_notification, {duration: 3000});
}

const open_prompt = document.createElement('span');
open_prompt.textContent = 'Open file: ';
const open_files = document.createElement('span');
open_prompt.appendChild(open_files);
function cm_open(cm) {
    if (dialog) dialog();
    send('open', true);
    dialog = cm.openNotification(open_prompt, {duration: 0});
}

const save_prompt = document.createElement('span');
save_prompt.textContent = 'Save file: /files/';
const save_input = document.createElement('input');
save_input.type = 'text';
save_prompt.appendChild(save_input);

function send_save() {
    if (save_input.value) {
        const name = save_input.value;
        const text = editor.getValue();
        state.filename = name;
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
        if (state.filename) save_input.value = state.filename;
        cm.openDialog(save_prompt, send_save, {onInput});
    }
}

document.addEventListener('keyup', function(e) {
    if ((e.keyCode === 27) && dialog) {
        dialog();
        dialog = false;
    }
});
export {cm_open, cm_save, open, save, load, help, set_visibility}
