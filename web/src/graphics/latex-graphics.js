function handle_latex_graphics_message(message) {
    const {name, latex} = message;
    const window = windows[name] || new LatexWindow(name);
    latex.split('$$').filter((d, i) => i % 2 === 1).forEach(l => window.render(l));
}

class LatexWindow extends Window {
    constructor(name) {
        super(name);
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
