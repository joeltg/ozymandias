/**
 * Created by joel on 8/28/16.
 */

const stdout = document.getElementById('stdout');

function log(text) {
    stdout.innerText += text;
    stdout.scrollTop = stdout.scrollHeight;
}

const defaults = {
    keyMap: 'sublime',
    visibility: 'close',
    theme: 'monokai',
    mode_index: 0,
    width: 400,
    height: 300
};

const state = {
    user: window.user,
    file: window.file,
    position: false,
    windows: {},
    canvases: {},
    expressions: {},
    visibility: defaults.visibility,
    theme: defaults.theme,
    keyMap: defaults.keyMap,
    error: false
};

function strip(string) {
    return string.split('\n').join(' ');
}

export {strip, state, defaults, stdout, log};