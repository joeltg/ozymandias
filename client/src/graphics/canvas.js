import {scaleLinear} from 'd3-scale';
import {state} from '../utils';
const {canvases} = state;
import {send} from '../connect';
import {editor} from '../editor/editor';

const size = 300;
const point = 1;

const panel = document.getElementById('graphics-panel');
const dom = tag => document.createElement(tag);
const make = (e, l) => new Array(l).fill(e).map(dom);
class Canvas {
    constructor(id) {
        this.id = id;
        this.closed = true;
        this.get_coordinates = false;
        this.frame = document.createElement('table');
        this.frame.className = 'graphics-frame';
        const rows = make('tr', 2), cells = make('td', 4);

        [this.x_left, this.x_right, this.y_top, this.y_bot] = make('span', 4);
        this.canvas = document.createElement('canvas');
        this.canvas.onclick = e => this.click(e);
        this.context = this.canvas.getContext('2d');
        this.canvas.height = this.canvas.width = size;
        this.cursor = [0, 0];

        cells[0].appendChild(this.x_left);
        cells[0].appendChild(this.x_right);

        cells[2].appendChild(this.canvas);

        cells[3].appendChild(this.y_top);
        cells[3].appendChild(this.y_bot);

        rows[0].appendChild(cells[0]);
        rows[0].appendChild(cells[1]);
        rows[1].appendChild(cells[2]);
        rows[1].appendChild(cells[3]);
        this.frame.appendChild(rows[0]);
        this.frame.appendChild(rows[1]);

        const {position} = state;

        if (position) {
            const {line} = position;
            if (editor.getLine(line)) {
                editor.replaceRange(`\n#; #[graphics-device ${this.id}]\n`, position);
                this.attach(line + 1);
            } else {
                editor.replaceRange(`#; #[graphics-device ${this.id}]\n`, position);
                this.attach(line);
            }
        }
    }
    attach(line) {
        this.widget = editor.addLineWidget(line, this.frame, {});
        this.handle = editor.addLineClass(line, 'background', 'cm-e');
        this.handle.on('delete', () => this.close(true));
        // editor.markText({line: line - 1}, {line}, {readOnly: true, inclusiveLeft: false, inclusiveRight: false});
        state.position = {line: line + 1};
        editor.setCursor(state.position);
    }
    click({offsetX, offsetY, button}) {
        if (this.get_coordinates) {
            this.get_coordinates = false;
            this.canvas.style.cursor = 'default';
            const x = this.x_scale.invert(offsetX);
            const y = this.y_scale.invert(offsetY);
            send('eval', `(get-pointer-coordinates-continuation ${x} ${y} ${button})\n`);
        }
    }
    set_labels() {
        this.x_left.textContent = this.xmin;
        this.x_right.textContent = this.xmax;
        this.y_top.textContent = this.ymin;
        this.y_bot.textContent = this.ymax;
    }
    open(value) {
        [this.xmin, this.ymax, this.xmax, this.ymin] = value;
        this.set_labels();
        this.x_scale = scaleLinear().domain([this.xmin, this.xmax]).range([0, this.canvas.width]).clamp(true);
        this.y_scale = scaleLinear().domain([this.ymin, this.ymax]).range([0, this.canvas.height]).clamp(true);
    }
    clear(value) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    close(value) {
        if (this.closed) {
            this.closed = false;
            if (value === true) {
                send('eval', `(*safe-graphics-close* #[graphics-device ${this.id}])\n`);
            } else {
                const line = this.handle.lineNo();
                this.widget.clear();
                this.canvas.parentNode.removeChild(this.canvas);
                editor.replaceRange('', {line, ch: 0}, {line: line + 1, ch: 0});
                delete canvases[this.id];
            }
        } else {
            delete canvases[this.id];
        }
    }
    set_coordinate_limits(value) {
        [this.xmin, this.ymax, this.xmax, this.ymin] = value;
        this.set_labels();
        this.x_scale.domain([this.xmin, this.xmax]).range([0, this.canvas.width]);
        this.y_scale.domain([this.ymin, this.ymax]).range([0, this.canvas.height]);
    }
    draw_rect(value) {
        const [x, y, width, height] = value;
        this.context.fillRect(this.x_scale(x), this.y_scale(y), width, height);
    }
    draw_rects(value) {
        value.forEach(([x, y, width, height]) => this.context.fillRect(this.x_scale(x), this.y_scale(y), width, height))
    }
    draw_point(value) {
        this.draw_rect(value.concat([point, point]));
    }
    draw_points(value) {
        this.draw_rects(value.map(p => p.concat([point, point])));
    }
    erase_rect(value) {
        const [x, y, width, height] = value;
        this.context.clearRect(this.x_scale(x), this.y_scale(y), width, height);
    }
    erase_rects(value) {
        value.forEach(([x, y, width, height]) => this.context.clearRect(this.x_scale(x), this.y_scale(y), width, height))
    }
    erase_point(value) {
        this.erase_rect(value.concat([point, point]));
    }
    erase_points(value) {
        this.erase_rects(value.map(p => p.concat([point, point])));
    }
    draw_line(value) {
        const [x0, y0, x1, y1] = value;
        const context = this.canvas.getContext('2d');
        context.beginPath();
        context.moveTo(this.x_scale(x0), this.y_scale(y0));
        context.lineTo(this.x_scale(x1), this.y_scale(y1));
        context.stroke();
    }
    draw_text(value) {
        const [x, y, string] = value;
        this.context.fillText(string, this.x_scale(x), this.y_scale(y));
    }
    set_font(value) {
        this.context.font = value;
    }
    move_cursor(value) {
        const [x, y] = value;
        this.cursor[0] = x;
        this.cursor[1] = y;
    }
    drag_cursor(value) {
        const [x0, y0] = this.cursor;
        const [x1, y1] = value;
        const context = this.canvas.getContext('2d');
        context.beginPath();
        context.moveTo(this.x_scale(x0), this.y_scale(y0));
        context.lineTo(this.x_scale(x1), this.y_scale(y1));
        context.stroke();
    }
    set_clip_rectangle(value) {

    }
    reset_clip_rectangle(value) {

    }
    set_background_color(value) {
        this.canvas.style.backgroundColor = value;
    }
    set_foreground_color(value) {
        this.context.fillStyle = value;
        this.context.strokeStyle = value;
    }
    get_pointer_coordinates(value) {
        this.canvas.style.cursor = 'crosshair';
        this.get_coordinates = true;
    }
}

function canvas({action, id, value}) {
    if (action === 'open') {
        const canvas = new Canvas(id);
        canvas.open(value);
        if (id in canvases) console.error('canvas already opened');
        else canvases[id] = canvas;
    } else {
        const canvas = canvases[id];
        if (canvas) canvas[action](value);
        else console.error('invalid canvas reference');
    }
}

export {canvas};
