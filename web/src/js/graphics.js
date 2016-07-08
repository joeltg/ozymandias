/**
 * Created by joel on 7/6/16.
 */

const default_width = 400, default_height = 300;

const windows = {};
const dialogs = document.getElementById('dialogs');

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
            close: () => this.close(),
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
    close() {
        if (windows[this.name]) delete windows[this.name];
        $(this.dialog).dialog('destroy');
        this.dialog.parentNode.removeChild(this.dialog);
    }
}