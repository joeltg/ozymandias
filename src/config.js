/**
 * Created by joel on 8/20/16.
 */

import $ from 'jquery';

import 'jquery-ui/ui/widget';
import 'jquery-ui/ui/position';
import 'jquery-ui/ui/data';
import 'jquery-ui/ui/disable-selection';
import 'jquery-ui/ui/focusable';
import 'jquery-ui/ui/form-reset-mixin';
import 'jquery-ui/ui/keycode';
import 'jquery-ui/ui/labels';
import 'jquery-ui/ui/scroll-parent';
import 'jquery-ui/ui/tabbable';
import 'jquery-ui/ui/unique-id';

import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/resizable';
import 'jquery-ui/ui/widgets/checkboxradio';
import 'jquery-ui/ui/widgets/controlgroup';
import 'jquery-ui/ui/widgets/mouse';
import 'jquery-ui/ui/widgets/button';
import 'jquery-ui/ui/widgets/dialog';

import 'jquery-ui/themes/base/core.css';
import 'jquery-ui/themes/base/base.css';
import 'jquery-ui/themes/base/theme.css';
import 'jquery-ui/themes/base/button.css';
import 'jquery-ui/themes/base/dialog.css';
import 'jquery-ui/themes/base/resizable.css';
import 'jquery-ui/themes/base/draggable.css';
import 'jquery-ui/themes/base/controlgroup.css';
import 'jquery-ui/themes/base/checkboxradio.css';

import {send} from './connect';
import {editor, editor_element} from './editor';
import {state, defaults} from './utils';

const icon_elements = [];
const icon_collection = editor_element.getElementsByClassName('icon');
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
        emacs: 'Shift-Tab',
        sublime: 'Shift-Tab'
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
    {
        element: document.getElementById('history-previous'),
        emacs: 'Meta-P',
        sublime: 'Up'
    },
    {
        element: document.getElementById('history-next'),
        emacs: 'Meta-N',
        sublime: 'Down'
    },
    {
        element: document.getElementById('quit'),
        emacs: 'Ctrl-G',
        sublime: 'Ctrl-Q'
    }
];

function set_theme(theme) {
    if (theme === 'light') theme = 'default';
    if (theme === 'dark') theme = 'monokai';
    state.theme = theme;
    icon_elements.forEach(element => element.style.visibility = 'hidden');
    icons[state.visibility][theme].style.visibility = 'visible';
    editor.setOption('theme', theme);
}

function set_visibility(visibility) {
    state.visibility = visibility;
    if (visibility === 'settings') $(`#hint`).fadeOut(50);
    else if (visibility === 'close') $(`#hint`).fadeIn(50);
    icon_elements.forEach(element => element.style.visibility = 'hidden');
    icons[visibility][state.theme].style.visibility = 'visible';
}

function toggle_visibility() {
    const visibility = (state.visibility === 'close' ? 'settings' : 'close');
    set_visibility(visibility);
}

function set_keyMap(keyMap) {
    labels.forEach(label => label.element.textContent = label[keyMap]);
    editor.setOption('keyMap', keyMap);
}

document.getElementById('icons').onclick = toggle_visibility;
$('.theme').click(e => set_theme(e.currentTarget.nextElementSibling.innerText));
$('.keyMap').click(e => set_keyMap(e.currentTarget.nextElementSibling.innerText));
set_visibility(defaults.visibility);
set_keyMap(defaults.keyMap);
set_theme(defaults.theme);

editor.focus();

const open_dialog = document.getElementById('open-dialog');
const save_dialog = document.getElementById('save-dialog');
const filename_input = document.getElementById('filename-input');
const filename = document.getElementById('filename');

let clean = true;

editor.on('change', (cm, change) => {
    if (state.filename && !editor.isClean() && clean) {
        filename.textContent = ` > ${state.filename}.scm*`;
        clean = false;
    }
});

$(open_dialog).dialog({
    title: 'Open file',
    autoOpen: false,
    width: defaults.width,
    resizable: true,
    buttons: [
        {text: 'Cancel (Esc)', click: function() {$(this).dialog('close')}}
    ]
});

$(save_dialog).dialog({
    title: 'Save file',
    autoOpen: false,
    width: defaults.width,
    resizable: true,
    buttons: [
        {text: 'Cancel (Esc)', click: function() {$(this).dialog('close')}},
        {text: 'Save (Enter)', click: send_save}
    ]
});

function open(files) {
    $(open_dialog).empty();
    files.forEach((label, index) => {
        const button = document.createElement('button');
        button.className = 'filename';
        button.addEventListener('click', e => {
            const name = e.target.textContent;
            state.filename = name;
            send('load', {name});
        });
        $(open_dialog).append(button);
        $(button).button({label});
        if (index === 0) button.focus();
    });
}

function load(data) {
    $(open_dialog).dialog('close');
    editor.setValue(data || '');
    editor.markClean();
    filename.textContent = ` > ${state.filename}.scm`;
    clean = true;
}

function save(data) {
    console.log('saved');
}

function send_save(event) {
    const name = filename_input.value;
    const text = editor.getValue();
    state.filename = name;
    filename.textContent = ` > ${name}.scm`;
    clean = true;
    if (name) {
        editor.markClean();
        send('save', {name, text});
        $(save_dialog).dialog('close');
    }
}

function send_open() {
    send('open', true);
}

function cm_open(cm) {
    $(open_dialog).dialog('open');
    send_open();
}

function cm_save(cm) {
    if (!editor.isClean()) {
        if (state.filename) filename_input.value = state.filename;
        $(save_dialog).dialog('open');
    }
}

$(document).keyup(e => {
    if (e.keyCode === 27) {
        $(save_dialog).dialog('close');
        $(open_dialog).dialog('close');
    }
});
$(filename_input).keyup(e => e.keyCode === 13 && send_save(e.target.value));
$('input').addClass("ui-widget ui-widget-content ui-corner-all");

export {cm_open, cm_save, open, save, load}