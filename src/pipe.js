/**
 * Created by joelg on 1/25/17.
 */

import {open, save, load} from './file';

import {stdout} from './stdout';
import {value, print} from './editor/editor';
import {error} from './error/error';
import {canvas} from './graphics/canvas';
import {state} from './utils';

const types = {
    canvas,
    stdout,
    value,
    print,
    error,
    open,
    save,
    load
};

function pipe({type, data}) {
    if (type in types) {
        types[type](data);
        state.mode = type;
    } else {
        console.error('invalid message type');
    }
}

export {pipe};