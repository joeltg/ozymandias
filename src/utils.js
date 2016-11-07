/**
 * Created by joel on 8/28/16.
 */

const defaults = {
    keyMap: 'sublime',
    visibility: 'close',
    theme: 'monokai',
    mode_index: 0,
    width: 400,
    height: 300,
    error: false
};

const state = {
    position: false,
    windows: {},
    filename: false,

    visibility: defaults.visibility,
    theme: defaults.theme,
    keyMap: defaults.keyMap
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

export {get_end, strip_string, state, defaults};