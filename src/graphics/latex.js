import katex from 'katex';
import 'katex/dist/katex.min.css';
import {Window} from './graphics';
import {state} from '../utils';
const {windows} = state;

function latex({name, latex}) {
    const window = windows[name] || new LatexWindow(name);
    latex.split('$$').filter((d, i) => i % 2 === 1).map(fix_matrices).forEach(l => window.render(l));
}

const key = '\\matrix';
const len = key.length;

function replace(string, index, i) {
    const beginning = string.slice(0, index);
    const middle = string.slice(index + len + 1, i);
    const end = string.slice(i + 1);
    return `${beginning}\\begin{matrix}${middle}\\end{matrix}${end}`;
}

function fix_matrix(string, index) {
    for (let i = index + len + 1, count = 0; i < string.length; i++) switch (string[i]) {
        case '{':
            count += 1;
            break;
        case '}':
            if (count === 0) return replace(string, index, i);
            count -= 1;
            break;
    }
    return string;
}

function fix_matrices(string) {
    let index, c = 0;
    while ((index = string.indexOf(key)) > -1 && c++ < string.length / len) string = fix_matrix(string, index);
    return string;
}

class LatexWindow extends Window {
    constructor(name) {
        super(name, true);
        this.boxes = [];
    }
    render(latex) {
        const child = document.createElement('div');
        this.dialog.appendChild(child);
        this.boxes.push(child);
        katex.render(latex, child, {displayMode: true, throwOnError: false});
    }
    clear() {
        this.boxes.forEach(child => this.dialog.removeChild(child));
    }
}

export {latex};