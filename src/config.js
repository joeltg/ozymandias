/**
 * Created by joel on 8/20/16.
 */

import Split from 'split.js';

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
import {repl} from './repl';
import {editor} from './editor';
import {default_state, default_keyMap, default_theme, default_width, default_height} from './utils';

const icons = {
    settings: {
        'monokai': 'images/ic_settings_white_36px.svg',
        'default': 'images/ic_settings_black_36px.svg'
    },
    close: {
        'monokai': 'images/ic_close_white_36px.svg',
        'default': 'images/ic_close_black_36px.svg'
    }
};

const global_labels = {
    'toggle-latex': {
        emacs: 'Shift-Tab',
        sublime: 'Shift-Tab'
    },
    'history-previous': {
        emacs: 'Meta-P',
        sublime: 'Up'
    },
    'history-next': {
        emacs: 'Meta-N',
        sublime: 'Down'
    },
    'quit': {
        emacs: 'Ctrl-G',
        sublime: 'Ctrl-Q'
    }
};

const global_label_array = Object.keys(global_labels).map(id => ({id, val: global_labels[id]}));

function set_theme(cm, theme) {
    if (theme === 'light') theme = 'default';
    if (theme === 'dark') theme = 'monokai';
    const {state, name} = cm.settings;
    cm.settings.theme = theme;
    $(`#${name}-icon`).attr('src', icons[state][theme]);
    cm.setOption('theme', theme);
}

function set_state(cm, state) {
    const {theme, name} = cm.settings;
    cm.settings.state = state;
    if (state === 'settings') $(`#${name}-hint`).fadeOut(50);
    else if (state === 'close') $(`#${name}-hint`).fadeIn(50);
    $(`#${name}-icon`).attr('src', icons[state][theme]);
}

function toggle_state(cm) {
    const state = (cm.settings.state === 'close' ? 'settings' : 'close');
    set_state(cm, state);
}

function set_keyMap(cm, keyMap) {
    const {name, labels} = cm.settings;
    global_label_array.forEach(label => $(`#${name}`).find(`.${label.id}`).text(label.val[keyMap]));
    Object.keys(labels).map(id => ({id, val: labels[id]})).forEach(label => $(`.${label.id}`).text(label.val[keyMap]));
    cm.setOption('keyMap', keyMap);
}

function initialize(cm) {
    const {name} = cm.settings;
    $(`#${name}-icon`).click(e => toggle_state(cm));
    $(`.${name}-theme`).click(e => set_theme(cm, e.currentTarget.nextElementSibling.innerText));
    $(`.${name}-keyMap`).click(e => set_keyMap(cm, e.currentTarget.nextElementSibling.innerText));
    set_state(cm, default_state);
    set_keyMap(cm, default_keyMap);
    set_theme(cm, default_theme);
}

initialize(repl);
initialize(editor);
editor.focus();

Split(['#editor', '#repl'], {
    sizes: [70, 30],
    direction: 'vertical',
    cursor: 'ns-resize',
    minSize: 8,
    gutterSize: 16
});

const open_dialog = document.getElementById('open');
const save_dialog = document.getElementById('save');
const filename = document.getElementById('filename');
const editor_filename = document.getElementById('editor_filename');

let clean = true;

editor.on('change', (cm, change) => {
    if (editor.filename && !editor.isClean() && clean) {
        editor_filename.textContent = ` > ${editor.filename}.scm*`;
        clean = false;
    }
});

$(open_dialog).dialog({
    title: 'Open file',
    autoOpen: false,
    width: default_width,
    resizable: true,
    buttons: [
        {
            text: "Cancel (Esc)",
            click: function() {
                $( this ).dialog( "close" );
            }
        }
    ]
});

$(save_dialog).dialog({
    title: 'Save file',
    autoOpen: false,
    width: default_width,
    resizable: true,
    buttons: [
        {
            text: "Cancel (Esc)",
            click: function() {
                $( this ).dialog( "close" );
            }
        },
        {
            text: "Save (Enter)",
            click: send_save
        }
    ]
});

function open(files) {
    $(open_dialog).empty();
    files.forEach((label, index) => {
        const button = document.createElement('button');
        button.className = 'filename';
        button.addEventListener('click', e => {
            const name = e.target.textContent;
            editor.filename = name;
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
    editor_filename.textContent = ` > ${editor.filename}.scm`;
    clean = true;
}

function save(data) {
    console.log('saved');
}

function send_save(event) {
    const name = filename.value;
    const text = editor.getValue();
    editor.filename = name;
    editor_filename.textContent = ` > ${name}.scm`;
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
    if (cm === editor) {
        $(open_dialog).dialog('open');
        send_open();
    }
}

function cm_save(cm) {
    if (cm === editor && !editor.isClean()) {
        if (editor.filename) filename.value = editor.filename;
        $(save_dialog).dialog('open');
    }
}

$(document).keyup(e => {
    if (e.keyCode === 27) {
        $(save_dialog).dialog('close');
        $(open_dialog).dialog('close');
    }
});
$(filename).keyup(e => e.keyCode === 13 && send_save(e.target.value));
$('input').addClass("ui-widget ui-widget-content ui-corner-all");

export {cm_open, cm_save, open, save, load}