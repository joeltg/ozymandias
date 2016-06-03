/**
 * Created by joelg on 6/2/16.
 */

var lastLine = 0;
var lastChar = 0;

function append_to_repl(string) {
    repl.replaceRange(string, CodeMirror.Pos(repl.lastLine()));
    repl.scrollIntoView();
}

function write(chunk) {
    append_to_repl(chunk);
    make_repl_read_only();
}

function make_repl_read_only() {
    lastLine = repl.lastLine();
    lastChar = repl.getLine(lastLine).length;

    repl.markText(
        {line: -1, ch: -1},
        {line: lastLine, ch: lastChar},
        {readOnly: true, inclusiveLeft: true}
    );
}

write('connecting to server...\n');

var webSocketServerUrl = 'ws://localhost:1947';
var webSocket = new WebSocket(webSocketServerUrl);

webSocket.onopen = event => write('connected to server.\n');
webSocket.onmessage = event => write(event.data);
webSocket.onclose = event => write('lost connection to server, please reload\n');

function evaluate_editor() {
    // value is the text of the editor
    var value = editor.getValue();
    console.log(value);
    write(value + '\n');
    webSocket.send(value);
}

function evaluate_repl() {
    append_to_repl('\n');
    var value = repl.getRange(
        {line: lastLine, ch: lastChar},
        {line: repl.lastLine(), ch: repl.getLine(repl.lastLine()).length}
    );
    console.log(value);
    make_repl_read_only();
    webSocket.send(value);
}

function interrupt() {
    webSocket.send("\<INTERRUPT\>");
}
function kill() {
    webSocket.send("\<KILL\>");
}

// set handlers for key events
editor.setOption('extraKeys', {
    "Tab": "indentMore",
    "Cmd-Enter": evaluate_editor,
    "Ctrl-Enter": evaluate_editor,
    "Shift-Enter": evaluate_editor,
    "Ctrl-S": null,
    "Cmd-S": null
});

repl.setOption('extraKeys', {
    "Tab": "indentMore",
    "Enter": evaluate_repl,
    "Ctrl-C": interrupt,
    "Ctrl-Z": kill,
    "Ctrl-S": null,
    "Cmd-S": null
});