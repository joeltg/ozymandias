/**
 * Created by joel on 7/6/16.
 */

import $ from 'jquery';

import './styles.css';

import {repl} from '../repl';
import {editor} from '../editor';
import {state, default_width, default_height} from '../utils';

const {windows} = state;
const dialogs = $('#dialogs');

class Window {
    constructor(name, resizable, width, height) {
        windows[name] = this;
        const source = editor.hasFocus() ? editor : repl;
        this.name = name;
        this.id = name.split(' ').join('-');
        this.dialog = document.createElement('div');
        this.dialog.id = 'dialog-' + this.id;
        dialogs.append(this.dialog);
        $(this.dialog).dialog({
            title: name,
            autoOpen: true,
            width: width || default_width,
            height: (height || default_height) + 40,
            close: e => this.close(),
            resizable,
            resize: (event, {size: {width, height}}) => {
                this.resize && this.resize(width - 2, height - 42);
            },
            dragStop: (event, ui) => editor.focus()
        });
        source.focus();
    }
    close() {
        if (windows[this.name]) delete windows[this.name];
        $(this.dialog).dialog('destroy');
        this.dialog.parentNode.removeChild(this.dialog);
    }
}

export {Window};