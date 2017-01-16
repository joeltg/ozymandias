import * as d3 from 'd3';
import {state} from './utils';
import {set_visibility} from './config';
import {hints, update} from './hint';
const {canvases} = state;

const size = 300;
const point = 1;

const panel = document.getElementById('graphics-panel');
const message = document.getElementById('graphics-message');
const make = (e, l) => new Array(l).fill(e).map(e => document.createElement(e));
class Canvas {
    constructor(id) {
        this.id = id;
        this.frame = document.createElement('table');
        this.frame.className = 'graphics-frame';
        const rows = make('tr', 2);
        const cells = make('td', 4);
        [this.x_left, this.x_right, this.y_top, this.y_bot] = make('span', 4);
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.height = this.canvas.width = size;
        if (Object.keys(canvases).length === 0) message.style.display = 'none';
        this.cursor = [0, 0];
        cells[1].appendChild(this.x_left);
        cells[1].appendChild(this.x_right);
        cells[2].appendChild(this.y_top);
        cells[2].appendChild(this.y_bot);
        cells[3].appendChild(this.canvas);
        rows[0].appendChild(cells[0]);
        rows[0].appendChild(cells[1]);
        rows[1].appendChild(cells[2]);
        rows[1].appendChild(cells[3]);
        this.frame.appendChild(rows[0]);
        this.frame.appendChild(rows[1]);
        panel.appendChild(this.frame);
        panel.parentElement.scrollLeft = this.frame.offsetLeft;
        if (state.visibility === 'settings') set_visibility('close');
        if (hints.graphics.state === 1) update(hints.graphics, 0)
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
        this.x_scale = d3.scaleLinear().domain([this.xmin, this.xmax]).range([0, this.canvas.width]).clamp(true);
        this.y_scale = d3.scaleLinear().domain([this.ymin, this.ymax]).range([0, this.canvas.height]).clamp(true);
    }
    clear(value) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    close(value) {
        this.canvas.parentNode.removeChild(this.canvas);
        delete canvases[this.id];
        if (Object.keys(canvases).length === 0) message.style.display = 'inline';
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
}

function canvas([action, id, value]) {
    if (!(id in canvases)) canvases[id] = new Canvas(id);
    if (action in canvases[id]) canvases[id][action](value);
    else console.error('invalid canvas operation', action);
}

export {canvas};
