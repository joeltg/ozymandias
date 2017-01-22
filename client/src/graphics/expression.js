/**
 * Created by joel on 9/26/16.
 */

import katex from 'katex';
import 'katex/dist/katex.min.css';

const modes = [
    'render_string',
    // 'render_latex_inline',
    'render_latex_display'
];

class Expression {
    constructor(string, tex, index) {
        this.string = string;
        this.tex = tex;
        this.node = document.createElement('span');
        this.update(index);
    }
    render_string() {
        this.node.textContent = this.string;
        this.node.className = 'cm-comment';
    }
    render_latex(mode) {
        if (this.tex) {
            this.node.textContent = '';
            this.node.className = 'cm-latex';
            const child = document.createElement('span');
            this.node.appendChild(child);
            katex.render(this.tex, child, {displayMode: mode, throwOnError: false});
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