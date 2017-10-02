/**
 * Created by joel on 8/20/16.
 */

import {editor, editor_element} from './editor/editor';
import {state, defaults} from './utils';
import CodeMirror from 'codemirror';
const mac = CodeMirror.keyMap.default === CodeMirror.keyMap.macDefault;
const ctrl = mac ? "Cmd-" : "Ctrl-";

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
        emacs: 'Meta-Z',
        sublime: ctrl + 'Enter'
    },
    {
        element: document.getElementById('eval-document'),
        emacs: 'Meta-O',
        sublime: ctrl + 'Shift-Enter'
    },
    {
        element: document.getElementById('clear-values'),
        emacs: 'Ctrl-Shift-Backspace',
        sublime: ctrl + 'Shift-Backspace'
    },
    // {
    //     element: document.getElementById('view'),
    //     emacs: 'Tab',
    //     sublime: 'Tab'
    // },
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
    editor.focus();
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
    editor.focus();
}

function cm_help(cm) {
    const visibility = (state.visibility === 'close' ? 'settings' : 'close');
    set_visibility(visibility);
    cm.focus();
}

function set_keyMap(keyMap) {
    labels.forEach(label => label.element.textContent = label[keyMap]);
    editor.setOption('keyMap', keyMap);
    editor.focus();
}

document.getElementById('icons').onclick = e => cm_help(editor);
document.getElementById('keyMap-emacs').onclick = e => set_keyMap('emacs');
document.getElementById('keyMap-sublime').onclick = e => set_keyMap('sublime');
document.getElementById('theme-light').onclick = e => set_theme('default');
document.getElementById('theme-dark').onclick = e => set_theme('monokai');
set_visibility(defaults.visibility);
set_keyMap(defaults.keyMap);
set_theme(defaults.theme);

editor.focus();

export {cm_help, set_visibility}
