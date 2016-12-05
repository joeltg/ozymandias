/**
 * Created by joel on 8/28/16.
 */

const stdout = document.getElementById('stdout');

function log(text) {
    stdout.innerText += text;
}

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
    canvases: {},
    filename: false,

    visibility: defaults.visibility,
    theme: defaults.theme,
    keyMap: defaults.keyMap
};

function strip(string) {
    for (let s = string.substr(0, 1); s === '\n' || s === ' '; s = string.substr(0, 1))
        string = string.substr(1);
    for (let s = string.substr(string.length - 1); s === '\n' || s === ' '; s = string.substr(string.length - 1))
        string = string.substr(0, string.length - 1);
    return string;
}

export {strip, state, defaults, stdout, log};