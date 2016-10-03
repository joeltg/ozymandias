/**
 * Created by joel on 9/26/16.
 */
import katex from 'katex';
import 'katex/dist/katex.min.css';

const modes = ['render_string', 'render_latex_inline', 'render_latex_display'];

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

class Expression {
    constructor(string, tex, index) {
        this.string = string;
        const key = '$$';
        if (tex) {
            const start = tex.indexOf(key) + key.length;
            const end = tex.lastIndexOf(key);
            this.latex = fix_matrices(tex.substring(start, end));
        } else {
            this.latex = false;
        }
        this.node = document.createElement('span');
        this.update(index);
    }
    render_string() {
        this.node.textContent = '#|' + this.string + '|#';
        this.node.className = 'cm-comment';
    }
    render_latex(mode) {
        if (this.latex) {
            this.node.textContent = '';
            this.node.className = 'cm-latex';
            const child = document.createElement('span');
            this.node.appendChild(child);
            katex.render(this.latex, child, {displayMode: mode, throwOnError: false});
        } else {
            this.render_string();
        }
    }
    render_latex_inline() {
        this.render_latex(false);
    }
    render_latex_display() {
        this.render_latex(true);
    }
    update(index) {
        const mode = modes[index];
        this.index = index;
        this.mode = mode;
        this[mode]();
        return true;
    }
}

export {Expression, modes}