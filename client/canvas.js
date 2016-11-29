import * as d3 from 'd3';
import {editor} from './editor';
const canvases = {};

const size = 300;
const margin = 20;
const point = 1;

const div = document.createElement('div');
div.id = 'graphics-panel';
div.style.height = size + (2 * margin);
const span = document.createElement('span');
span.id = 'placeholder';
span.textContent = 'no windows open';
div.appendChild(span);

let panel = false;

function toggle(cm) {
    if (panel) {
        panel.clear();
        panel = false;
    } else {
        panel = cm.addPanel(div, {position: 'bottom'});
    }
    cm.focus();
}

const actions = {
    open(id, value) {
        const [xmin, ymax, xmax, ymin] = value;
        const element = document.createElement('canvas');
        const context = element.getContext('2d');
        element.height = element.width = size;
        if (Object.keys(canvases).length === 0) span.textContent = '';
        div.appendChild(element);
        const x_scale = d3.scaleLinear().domain([xmin, xmax]).range([0, element.width]).clamp(true);
        const y_scale = d3.scaleLinear().domain([ymin, ymax]).range([0, element.height]).clamp(true);
        canvases[id] = {element, context, x_scale, y_scale, cursor: [0, 0]};
        if (!panel) toggle(editor);
    },
    clear(id, value) {
        const {element, context} = canvases[id];
        context.clearRect(0, 0, element.width, element.height);
    },
    close(id, value) {
        const {element} = canvases[id];
        element.parentNode.removeChild(element);
        delete canvases[id];
        if (Object.keys(canvases).length === 0) span.textContent = 'no windows open';
        if (panel) toggle(editor);
    },
    set_coordinate_limits(id, value) {
        const {element, x_scale, y_scale} = canvases[id];
        const [xmin, ymax, xmax, ymin] = value;
        x_scale.domain([xmin, xmax]).range([0, element.width]);
        y_scale.domain([ymin, ymax]).range([0, element.height]);
    },
    draw_rect(id, value) {
        const {context, x_scale, y_scale} = canvases[id];
        const [x, y, width, height] = value;
        context.fillRect(x_scale(x), y_scale(y), width, height);
    },
    draw_rects(id, value) {
        const {context, x_scale, y_scale} = canvases[id];
        value.forEach(([x, y, width, height]) => context.fillRect(x_scale(x), y_scale(y), width, height))
    },
    draw_point(id, value) {
        this.draw_rect(id, value.concat([point, point]));
    },
    draw_points(id, value) {
        this.draw_rects(id, value.map(p => p.concat([point, point])));
    },
    erase_rect(id, value) {
        const {context, x_scale, y_scale} = canvases[id];
        const [x, y, width, height] = value;
        context.clearRect(x_scale(x), y_scale(y), width, height);
    },
    erase_rects(id, value) {
        const {context, x_scale, y_scale} = canvases[id];
        value.forEach(([x, y, width, height]) => context.clearRect(x_scale(x), y_scale(y), width, height))
    },
    erase_point(id, value) {
        this.erase_rect(id, value.concat([point, point]));
    },
    erase_points(id, value) {
        this.erase_rects(id, value.map(p => p.concat([point, point])));
    },
    draw_line(id, value) {
        const {element, x_scale, y_scale, path} = canvases[id];
        const [x0, y0, x1, y1] = value;
        const context = element.getContext('2d');
        context.beginPath();
        context.moveTo(x_scale(x0), y_scale(y0));
        context.lineTo(x_scale(x1), y_scale(y1));
        context.stroke();
    },
    draw_text(id, value) {
        const {context, x_scale, y_scale} = canvases[id];
        const [x, y, string] = value;
        context.fillText(string, x_scale(x), y_scale(y));
    },
    set_font(id, value) {
        const {context} = canvases[id];
        context.font = value;
    },
    move_cursor(id, value) {
        const {cursor} = canvases[id];
        const [x, y] = value;
        cursor[0] = x;
        cursor[1] = y;
    },
    drag_cursor(id, value) {
        const {element, x_scale, y_scale, cursor} = canvases[id];
        const [x0, y0] = cursor;
        const [x1, y1] = value;
        const context = element.getContext('2d');
        context.beginPath();
        context.moveTo(x_scale(x0), y_scale(y0));
        context.lineTo(x_scale(x1), y_scale(y1));
        context.stroke();
    },
    set_clip_rectangle(id, value) {
        const {element, x_scale, y_scale} = canvases[id];
        const [xmin, xmax, ymin, ymax] = value;
        const x_range = [x_scale.invert(xmin), x_scale.invert(xmax)];
        const y_range = [y_scale.invert(ymin), y_scale.invert(ymax)];
        const x_domain = [x_scale(xmin), x_scale(xmax)];
        const y_domain = [y_scale(ymin), y_scale(ymax)];
        x_scale.domain(x_domain).range(x_range);
        y_scale.domain(y_domain).range(y_range);
    },
    reset_clip_rectangle(id, value) {
        const {element, x_scale, y_scale} = canvases[id];
        const [xmin, ymax, xmax, ymin] = value;
        x_scale.domain([xmin, xmax]).range([0, element.width]);
        y_scale.domain([ymin, ymax]).range([0, element.height]);
    }
};

function canvas([action, id, value]) {
    if (action in actions) actions[action](id, value);
    else console.error('invalid canvas operation', action);
}

export {canvas, toggle};
