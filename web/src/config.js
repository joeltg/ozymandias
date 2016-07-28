/**
 * Created by joel on 7/22/16.
 */

let repl_height, editor_height;

function getEnd(cm) {
    const line = cm.lastLine();
    const ch = cm.getLine(line).length;
    return {line, ch};
}

function set_theme(cm, theme) { cm.setOption('theme', theme) }
function set_keymap(value) {
    repl.setOption('keyMap', value);
    editor.setOption('keyMap', value);
}

function set_layout(layout) {
    const height = window.innerHeight;
    switch (layout) {
        case 'split':
            editor_height = repl_height = Math.floor(height / 2.0) - 1;
            break;
        case 'repl_only':
            editor_height = 0;
            repl_height = height;
            break;
        case 'editor_only':
            editor_height = height;
            repl_height = 0;
            break;
    }
    editor.setSize(null, editor_height);
    repl.setSize(null, repl_height);
}

window.addEventListener('resize', set_layout);
set_layout('repl_only');

const settings = document.getElementById('settings-dialog');
settings.paddingLeft = 8;
$(settings).dialog({
    title: 'Settings',
    autoOpen: false,
    width: 350,
    resizable: false,
    buttons: {Close: () => $(settings).dialog( "close" )}
});

$('.setting').buttonset();

// override Ctrl+S and Cmd+S to not try to save the page
document.addEventListener("keydown", function(e) {
    if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey))
        e.preventDefault();
}, false);