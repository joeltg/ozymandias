/**
 * Created by joel on 6/8/16.
 */

// Replace with the URL of your server
const websocket_url = 'ws://localhost:1947';
// const websocket_url = 'ws://maharal.csail.mit.edu:1947';
const socket = new WebSocket(websocket_url);

const console_delimiter = /\s*\n\d+ (?:(?:]=)|(?:error))> /;
const graphics_delimiter = '\n';
let console_buffer = '';
let graphics_buffer = '';

// for moving up/down the repl history with the arrow keys
const repl_history = [];
let repl_history_pointer = 0;

let lastLine = 0;
let lastChar = 0;
let editor_position = false;
let repl_height, editor_height;

const output = document.getElementById('output'),
    input = document.getElementById('input');

const repl = CodeMirror(output, {
    mode:  "scheme",
    theme: 'monokai',
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: 'emacs',
    'extraKeys': {
        "Tab": "indentMore",
        "Enter": evaluate_repl,
        "Ctrl-G": () => socket.send("\<SIGINT\>"),
        "Up": move_up_repl_history,
        "Down": move_down_repl_history
    }
});

const editor = CodeMirror(input, {
    mode:  "scheme",
    theme: 'monokai',
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: 'emacs',
    'extraKeys': {
        "Tab": "indentMore",
        "Alt-Z": e => evaluate_editor('current'),
        "Alt-O": e => evaluate_editor('everything'),
        "Cmd-Enter": e => evaluate_editor('adjacent'),
        "Ctrl-Enter": e => evaluate_editor('adjacent'),
        "Shift-Enter": e => evaluate_editor('adjacent'),
        "Ctrl+S+Enter": e => evaluate_editor('selection'),
        "Shift+S+Enter": e => evaluate_editor('selection'),
        "Cmd+S+Enter": e => evaluate_editor('selection'),
        "Ctrl+X Ctrl+E": e => evaluate_editor('previous')
    }
});


// Settings

function set_theme(cm, theme) {
    cm.setOption('theme', theme);
}

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
        case 'repl':
            editor_height = 0;
            repl_height = height;
            break;
        case 'editor':
            editor_height = height;
            repl_height = 0;
            break;
    }
    resize();
}

function resize() {
    editor.setSize(null, editor_height);
    repl.setSize(null, repl_height);
}

window.addEventListener('resize', resize);
set_layout('repl');

// Printing
function write(string) {
    // append
    repl.replaceRange(string, CodeMirror.Pos(repl.lastLine()));

    // move line and char pointers to the new end
    lastLine = repl.lastLine();
    lastChar = repl.getLine(lastLine).length;

    // freeze the repl as read-only
    repl.markText(
        {line: -1, ch: -1},
        {line: lastLine, ch: lastChar},
        {readOnly: true, inclusiveLeft: true}
    );

    // scroll to the end
    repl.setCursor({line: lastLine, ch: lastChar});
    repl.scrollIntoView();
}

write('connecting to server...\n');
socket.onopen = event => write('connected to server.\n');

socket.onmessage = event => {
    const {content, source} = JSON.parse(event.data);
    let values;
    if (source === 'client_repl') {
        write(content);
        values = (console_buffer + content).split(console_delimiter);
        console_buffer = values.pop();
        if (editor_position) values.forEach(value => {
            editor_position = editor.getCursor();
            if (value[0] === '\n') value = value.substring(1);
            editor.replaceRange(value, editor_position, editor_position);
            editor_position = false;
        });
    } else if (source === 'svg-graphics') {
        values = (graphics_buffer + content).split(graphics_delimiter);
        graphics_buffer = values.pop();
        values.forEach(value => handle_svg_graphics_message(JSON.parse(value)));
    } else if (source === 'canvas-graphics') {
        values = (graphics_buffer + content).split(graphics_delimiter);
        graphics_buffer = values.pop();
        values.forEach(value => handle_canvas_graphics_message(JSON.parse(value)));
    } else console.error('message type not recognized');
};

socket.onclose = event => write('lost connection to server, please reload\n');

function toEnclosingExpr(cm) {
    var pos = cm.getCursor(), line = pos.line, ch = pos.ch;
    console.log(pos);
    var stack = [];
    while (line >= cm.firstLine()) {
        var text = cm.getLine(line);
        for (var i = ch == null ? text.length : ch; i > 0;) {
            var ch = text.charAt(--i);
            if (ch == ")")
                stack.push("(");
            else if (ch == "]")
                stack.push("[");
            else if (ch == "}")
                stack.push("{");
            else if (/[\(\{\[]/.test(ch) && (!stack.length || stack.pop() != ch))
            {
                console.log('yay', line, i);
                var pos = CodeMirror.Pos(line, i);
                cm.extendSelection(pos);
                return pos;
            }
        }
        --line; ch = null;
    }
}

function repeated(f, last) {
    var val = f();
    if (val) return repeated(f, val);
    else return last;
}

function evaluate_editor_paren_block(position) {
    const parens = editor.findMatchingBracket(position);
    let value = '';
    if (parens && parens.match) {
        // else if there cursor is adjacent to a parenthesis that has
        // a valid match, evaluate just the paren'd expression

        const start = parens.forward ? parens.from : parens.to;
        const end = parens.forward ? parens.to : parens.from;
        end.ch += 1;
        value = editor.getRange(start, end);
        editor_position = {line: end.line + 1, ch: 0};
        if (editor_position.line >= editor.lineCount()) editor.replaceRange('\n', end, end);
        editor.setCursor(editor_position);
        editor.scrollIntoView();
    }
    return value;
}

function evaluate_editor(code) {
    let value = '';
    switch(code) {
        case 'everything':
            value = editor.getValue();
            editor_position = {line: editor.lineCount(), ch: 0};
            break;
        case 'adjacent':
            value = evaluate_editor_paren_block(editor.getCursor());
            break;
        case 'current':
            let pos = repeated(() => toEnclosingExpr(editor));
            value = evaluate_editor_paren_block(pos);
            break;
        case 'previous':
            break;
        case 'selection':
            if (editor.somethingSelected()) {
                // if there's something selected, evaluate only the selection

                value = editor.getSelection();
                editor_position = editor.getCursor('to');

                // if the selection dangles by 0 characters onto a new line,
                // trim it to only extend to the last character of the previous line.
                if (editor_position.ch === 0) editor_position = {
                    line: editor_position.line - 1,
                    ch: editor.getLine(editor_position.line - 1).length
                };

                editor.setCursor(editor_position);
                editor.scrollIntoView();
            }
            break;
        default:
            return;
    }

    const length = value.length;
    if (value.substring(length - 1, length) !== '\n') value += '\n';
    socket.send(JSON.stringify({source: 'client_repl', content: value}));
}

function evaluate_repl() {
    const line = repl.lastLine();
    const ch = repl.getLine(line).length;
    const value = repl.getRange(
        {line: lastLine, ch: lastChar},
        {line: line, ch: ch}
    );
    if (value) repl_history_pointer = repl_history.push(value);
    write('\n');
    editor_position = false;
    socket.send(JSON.stringify({source: 'client_repl', content: value + '\n'}));
}

function move_up_repl_history() {
    if (repl_history_pointer < 1) return;

    const line = repl.lastLine();
    const ch = repl.getLine(line).length;

    const string = repl_history[--repl_history_pointer];

    repl.replaceRange(string, {line: lastLine, ch: lastChar}, {line: line, ch: ch});
}

function move_down_repl_history() {
    if (repl_history_pointer > repl_history.length - 1) return;

    const line = repl.lastLine();
    const ch = repl.getLine(line).length;
    const string = ++repl_history_pointer < repl_history.length ?
        repl_history[repl_history_pointer] : '';

    repl.replaceRange(string, {line: lastLine, ch: lastChar}, {line: line, ch: ch});
}

const settings = document.getElementById('settings-dialog');
settings.paddingLeft = 8;
$(settings).dialog({
    title: 'Settings',
    autoOpen: false,
    width: 303,
    resizable: false,
    buttons: {Close: () => $(settings).dialog( "close" )}
});

$('.setting').buttonset();

// override Ctrl+S and Cmd+S to not try to save the page
document.addEventListener("keydown", function(e) {
    if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey))
        e.preventDefault();
}, false);
