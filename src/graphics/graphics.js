/**
 * Created by joel on 7/6/16.
 */

import $ from 'jquery';

import './styles.css';

import {editor} from '../editor';
import {state, defaults} from '../utils';

const {windows} = state;
const dialogs = $('#dialogs');

class Window {
    constructor(name, resizable, width, height) {
        windows[name] = this;
        this.name = name;
        this.id = name.split(' ').join('-');
        this.dialog = document.createElement('div');
        this.dialog.id = 'dialog-' + this.id;
        dialogs.append(this.dialog);
        $(this.dialog).dialog({
            title: name,
            autoOpen: true,
            width: width || defaults.width,
            height: (height || defaults.height) + 40,
            close: e => this.close(),
            resizable,
            resize: (event, {size: {width, height}}) => {
                this.resize && this.resize(width - 2, height - 42);
            },
            dragStop: (event, ui) => editor.focus()
        });
        editor.focus();
    }
    close() {
        if (windows[this.name]) delete windows[this.name];
        $(this.dialog).dialog('destroy');
        this.dialog.parentNode.removeChild(this.dialog);
    }
}

export {Window};