/**
 * Created by joel on 7/6/16.
 */

import $ from 'jquery';

import 'jquery-ui/ui/widget';
import 'jquery-ui/ui/position';
import 'jquery-ui/ui/data';
import 'jquery-ui/ui/disable-selection';
import 'jquery-ui/ui/focusable';
import 'jquery-ui/ui/form-reset-mixin';
import 'jquery-ui/ui/keycode';
import 'jquery-ui/ui/labels';
import 'jquery-ui/ui/scroll-parent';
import 'jquery-ui/ui/tabbable';
import 'jquery-ui/ui/unique-id';

import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/resizable';
import 'jquery-ui/ui/widgets/checkboxradio';
import 'jquery-ui/ui/widgets/controlgroup';
import 'jquery-ui/ui/widgets/mouse';
import 'jquery-ui/ui/widgets/button';
import 'jquery-ui/ui/widgets/dialog';

import 'jquery-ui/themes/base/core.css';
import 'jquery-ui/themes/base/base.css';
import 'jquery-ui/themes/base/theme.css';
import 'jquery-ui/themes/base/button.css';
import 'jquery-ui/themes/base/dialog.css';
import 'jquery-ui/themes/base/resizable.css';
import 'jquery-ui/themes/base/draggable.css';
import 'jquery-ui/themes/base/controlgroup.css';
import 'jquery-ui/themes/base/checkboxradio.css';

import './styles.css';

import {repl} from '../repl';
import {editor} from '../editor';
import {state} from '../utils';

const default_width = 400, default_height = 300;

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

export {Window};