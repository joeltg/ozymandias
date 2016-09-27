/**
 * Created by joel on 8/28/16.
 */

const default_keyMap = 'sublime';
const default_state = 'close';
const default_theme = 'monokai';

const default_width = 400, default_height = 300;

const state = {
    editor_position: false,
    last_position: {line: 0, ch: 0},
    windows: {}
};

function get_end(cm) {
    const line = cm.lastLine();
    const ch = cm.getLine(line).length;
    return {line, ch};
}

function strip_string(string) {
    for (let s = string.substr(0, 1); s === '\n' || s === ' '; s = string.substr(0, 1))
        string = string.substr(1);
    for (let s = string.substr(string.length - 1); s === '\n' || s === ' '; s = string.substr(string.length - 1))
        string = string.substr(0, string.length - 1);
    return string;
}

export {default_keyMap, default_state, default_theme, get_end, strip_string, state, default_width, default_height};