/**
 * Created by joel on 7/6/16.
 */

const default_width = 400, default_height = 300;

const windows = {};
const dialogs = document.getElementById('dialogs');

function handle_graphics_message(message) {
    console.log(message);
    if (message.type === 'canvas') handle_canvas_graphics_message(message);
    else if (message.type === 'svg') handle_svg_graphics_message(message);
    else if (message.type === 'latex') handle_latex_graphics_message(message);
    else console.error('graphics type not recognized');
}

class Window {
    constructor(name, resizable, width, height) {
        windows[name] = this;
        const source = editor.hasFocus() ? editor : repl;
        this.name = name;
        this.id = name.split(' ').join('-');
        this.dialog = document.createElement('div');
        this.dialog.id = 'dialog-' + this.id;
        dialogs.appendChild(this.dialog);
        $(this.dialog).dialog({
            title: name,
            autoOpen: true,
            width: width || default_width,
            height: (height || default_height) + 40,
            close: e => this.close(),
            resizable: resizable,
            resize: (event, ui) => {
                const size = ui.size;
                const width = size.width - 2;
                const height = size.height - 42;
                this.resize(width, height);
            }
        });
        source.focus();
    }
    resize() {
        
    }
    close() {
        if (windows[this.name]) delete windows[this.name];
        $(this.dialog).dialog('destroy');
        this.dialog.parentNode.removeChild(this.dialog);
    }
}
