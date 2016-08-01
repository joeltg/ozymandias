/**
 * Created by joel on 7/22/16.
 */

const default_theme = 'monokai';
const default_keyMap = 'emacs';
const default_state = 'close';

const icons = {
    settings: {
        'monokai': 'src/images/ic_settings_white_36px.svg',
        'default': 'src/images/ic_settings_black_36px.svg'
    },
    close: {
        'monokai': 'src/images/ic_close_white_36px.svg',
        'default': 'src/images/ic_close_black_36px.svg'
    }
};

const global_labels = {
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
        sublime: 'Ctrl-C'
    }
};

const global_label_array = Object.keys(global_labels).map(id => ({id, val: global_labels[id]}));

CodeMirror.commands.quit = cm => send_data('kill', 'SIGINT');
CodeMirror.commands.save = cm => console.log('save!');

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
    $(`.${name}-theme`).click(({currentTarget: {labels: [{innerText}]}}) => set_theme(cm, innerText));
    $(`.${name}-keyMap`).click(({currentTarget: {labels: [{innerText}]}}) => set_keyMap(cm, innerText));
    set_state(cm, default_state);
    set_keyMap(cm, default_keyMap);
    set_theme(cm, default_theme);
}

initialize(repl);
initialize(editor);
repl.focus();

Split(['#editor', '#repl'], {
    sizes: [50, 50],
    direction: 'vertical',
    cursor: 'ns-resize',
    minSize: 8,
    gutterSize: 16,
    // onDrag: function() {
    //     repl.scrollIntoView();
    //     editor.scrollIntoView();
    // }
});

function getEnd(cm) {
    const line = cm.lastLine();
    const ch = cm.getLine(line).length;
    return {line, ch};
}

function strip_string(string) {
    for (let s = string.substring(0, 1); s === '\n' || s === ' '; s = string.substring(0, 1))
        string = string.substring(1);
    for (let s = string.substring(string.length - 1); s === '\n' || s === ' '; s = string.substring(string.length - 1))
        string = string.substring(0, string.length - 1);
    return string;
}

// override Ctrl+S and Cmd+S to not try to save the page
document.addEventListener('keydown', function(e) {
    if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) e.preventDefault();
}, false);
