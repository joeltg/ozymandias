/**
 * Created by joel on 6/8/16.
 */

// Replace with the URL of your server
var websocket_url = 'ws://localhost:1947';
// var websocket_url = 'ws://maharal.csail.mit.edu:1947';
var socket = new WebSocket(websocket_url);

var repl_history = [];
var lastLine = 0;
var lastChar = 0;
var repl_height, editor_height;
var editor_position;

var buffer = '';

var output = document.getElementById('output'),
    input = document.getElementById('input');

var repl = CodeMirror(output, {
    mode:  "scheme",
    theme: 'default',
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: 'sublime',
    'extraKeys': {
        "Tab": "indentMore",
        "Enter": evaluate_repl,
        "Ctrl-G": interrupt,
        "Ctrl-Z": kill,
        "Up": move_up_repl_history,
        "Down": move_down_repl_history
    }
});

var editor = CodeMirror(input, {
    mode:  "scheme",
    theme: 'monokai',
    autoCloseBrackets: true,
    autoMatchParens: true,
    matchBrackets: true,
    indentUnit: 2,
    indentWithTabs: false,
    keyMap: 'sublime',
    'extraKeys': {
        "Tab": "indentMore",
        "Cmd-Enter": evaluate_editor,
        "Ctrl-Enter": evaluate_editor,
        "Shift-Enter": evaluate_editor
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
    var height = window.innerHeight;
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
        default:
            break;
    }
    editor.setSize(null, editor_height);
    repl.setSize(null, repl_height);
}

set_layout('split');

// Printing

function write(string) {
    // append
    repl.replaceRange(string, CodeMirror.Pos(repl.lastLine()));

    // freeze
    lastLine = repl.lastLine();
    lastChar = repl.getLine(lastLine).length;

    repl.markText(
        {line: -1, ch: -1},
        {line: lastLine, ch: lastChar},
        {readOnly: true, inclusiveLeft: true}
    );

    // scroll
    repl.setCursor({line: lastLine, ch: lastChar});
    repl.scrollIntoView();
}

write('connecting to server...\n');

socket.onopen = function(event) {
    write('connected to server.\n')
};

socket.onmessage = function(event) {
    // console.log(event.data);
    var value = JSON.parse(event.data);
    if (value instanceof String || typeof value === 'string') {
        write(value);

        // write to buffer
        var data = (buffer + value).split(/\s*\n\d+ (?:(?:]=)|(?:error))> /);
        buffer = data[data.length - 1];

        data.slice(0, -1).forEach(function(result) {
            // console.log(result);
            if (editor_position) {
                editor.replaceRange('\n; ' + result.split('\n').join('\n; '), editor_position, editor_position);
            }
        });
    } else if (value instanceof Object) {
        // if (value.type === 'plot' && value.name && value.data instanceof Array) {
        //     var xscale = 1, yscale = 1, xmin = 0, ymin = 0, xmax = 0, ymax = 0;
        //
        //     if (value.range) {
        //         xmin = value.range.x[0]; xmax = value.range.x[1];
        //         ymin = value.range.y[0]; ymax = value.range.y[1];
        //     }
        //
        //     var ratio = (ymax - ymin) / (xmax - xmin);
        //
        //     var width = 400, height = 400 * ratio;
        //
        //     xscale = width / (xmax - xmin);
        //     yscale = height / (ymax - ymin);
        //
        //     var canvas = document.createElement('canvas');
        //     canvas.width = width; canvas.height = height;
        //
        //     paper.setup(canvas);
        //
        //
        //     var points = value.data.map(function(datum) {
        //         var x = datum.x * xscale;
        //         var y = (ymax - datum.y) * yscale;
        //         return new paper.Path.Circle({
        //             center: [x, y],
        //             radius: 3,
        //             fillColor: '#000000',
        //             opacity: 1.0
        //         });
        //     });
        //     paper.view.draw();
        //
        //     // Draw the view now:
        //     var dialog = makeDialog(value.name, function(event, ui) {
        //         // var size = ui.size;
        //         // var original_size = ui.originalSize;
        //         // canvas.width = size.width; canvas.height = size.height - 36;
        //         // xscale = size.width / original_size.width;
        //         // yscale = size.height - 36 / original_size.height - 36;
        //         // points.forEach(function(point) {
        //         //     point.position = new paper.Point(point.position.x * xscale, point.position.y * yscale);
        //         // });
        //         // console.log(size);
        //     });
        //     dialog.appendChild(canvas);
        //
        //     function draw(width, height) {
        //
        //     }
        // }
        console.log(value);

        switch (value.action) {
            case 'plot':
                plot(value.name, value.data);
                break;
        }

    } else console.error('panic at the disco');
};

socket.onclose = function(event) {
    write('lost connection to server, please reload\n');
};

function evaluate_editor() {
    // value is the text of the editor
    var value;
    if (editor.somethingSelected()) {
        value = editor.getSelection('\n');
        editor_position = editor.getCursor('to');
    } else {
        value = editor.getValue();
        editor_position = null;
    }
    socket.send(value + '\n');
}

function evaluate_repl() {
    var value = repl.getRange(
        {line: lastLine, ch: lastChar},
        {line: repl.lastLine(), ch: repl.getLine(repl.lastLine()).length}
    ) + '\n';
    // repl_history.push(value);
    write('\n');
    editor_position = null;
    socket.send(value);
}

function interrupt() {
    socket.send("\<INTERRUPT\>");
}
function kill() {
    socket.send("\<KILL\>");
}

function move_up_repl_history() {

}

function move_down_repl_history() {

}

// override Ctrl+S and Cmd+S to not try to save the page
document.addEventListener("keydown", function(e) {
    if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey))
        e.preventDefault();
}, false);
