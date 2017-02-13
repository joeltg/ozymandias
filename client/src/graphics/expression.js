/**
 * Created by joel on 9/26/16.
 */

import katex from 'katex';
import 'katex/dist/katex.min.css';

class Expression {
    constructor(text, pretty, latex) {
        this.pretty = pretty ? pretty.trim() : text;
        this.latex = latex || '';
        this.index = 0;

        this.node = document.createElement('pre');
        this.child = null;

        this.modes = ['render_empty'];
        if (this.pretty && this.pretty !== text) {
            this.modes.push('render_pretty');
            if (this.latex) {
                this.modes.push('render_latex');
            }
            this.update(1);
        }
    }
    render_empty() {
        if (this.child) {
            this.node.removeChild(this.child);
            this.child = null;
        }
        this.node.innerText = '';
        this.node.className = 'cm-comment';
    }
    render_pretty() {
        if (this.child) {
            this.node.removeChild(this.child);
            this.child = null;
        }
        this.node.innerText = this.pretty;
        this.node.className = 'cm-pretty';
    }
    render_latex() {
        this.node.innerText = '';
        this.node.className = 'cm-latex';
        this.child = document.createElement('span');
        this.node.appendChild(this.child);
        katex.render(this.latex, this.child, {displayMode: true, throwOnError: false});
    }
    update(index) {
        const mode = this.modes[index];
        this.mode = mode;
        this.index = index;
        this[mode]();
    }
}

export {Expression}