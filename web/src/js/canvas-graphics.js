/**
 * Created by joel on 7/6/16.
 */

const default_x_domain = [-1, 1];
const default_y_domain = [-1, 1];

const point_x = 3, point_y = 3;

const drawing_modes = {};
const line_styles = {};

function handle_canvas_graphics_message(message) {
    const {name, action, value} = message;
    if (windows.hasOwnProperty(name)) {
        windows[name][action](value);
    } else {
        const window = new CanvasWindow(name, value.width, value.height);
        if (action) window[action](value);
    }
}

class CanvasWindow extends Window {
    constructor(name, width, height) {
        super(name, false, width, height);
        width = width || default_width;
        height = height || default_height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.dialog.appendChild(this.canvas);
        console.log(width, height);
        this.x = d3.scaleLinear().range([0, width]).domain(default_x_domain);
        this.y = d3.scaleLinear().range([height, 0]).domain(default_y_domain);

        this.context = this.canvas.getContext('2d');
    }
    set_domain(x_domain, y_domain) {
        if (x_domain) this.x.domain(x_domain);
        if (y_domain) this.y.domain(y_domain);
    }
    plot_point(value) {
        const device_x = this.x(value[0]), device_y = this.y(value[1]);
        this.context.fillRect(device_x, device_y, point_x, point_y);
    }
    plot_points(value) {
        value.forEach(this.plot_point);
    }
    set_coordinate_limits(value) {
        if (value.hasOwnProperty('x-left') && value.hasOwnProperty('x-right'))
            this.x.domain([value['x-left'], value['x-right']]);
        if (value.hasOwnProperty('y-top') && value.hasOwnProperty('y-bottom'))
            this.y.domain([value['y-bottom'], value['y-top']]);
    }
    clear(value) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    draw_point(value) {
        if (value.hasOwnProperty('x') && value.hasOwnProperty('y'))
            this.context.fillRect(value.x, value.y, point_x, point_y);
    }
    erase_point(value) {
        if (value.hasOwnProperty('x') && value.hasOwnProperty('y'))
            this.context.clearRect(value.x, value.y, point_x, point_y);
    }
    draw_line(value) {
        if (value.hasOwnProperty('x-start') && value.hasOwnProperty('x-end') &&
            value.hasOwnProperty('y-start') && value.hasOwnProperty('y-end')) {
            this.context.beginPath();
            this.context.moveTo(value['x-start'], value['y-start']);
            this.context.lineTo(value['x-end'], value['y-end']);
            this.context.stroke();
        }
    }
    draw_text(value) {
        if (value.hasOwnProperty('string') && value.hasOwnProperty('x') && value.hasOwnProperty('y'))
            this.context.fillText(value.string, value.x, value.y);
    }
    move_cursor(value) {
        if (value.hasOwnProperty('x') && value.hasOwnProperty('y'))
            this.context.moveTo(value.x, value.y);
    }
    drag_cursor(value) {
        if (value.hasOwnProperty('x') && value.hasOwnProperty('y'))
            this.context.lineTo(value.x, value.y);
    }
    set_drawing_mode(value) {
        if (value.hasOwnProperty('drawing-mode') &&
            drawing_modes.hasOwnProperty(value['drawing-mode']))
            this.context.fillStyle = drawing_modes[value['drawing-mode']];
    }
    set_line_style(value) {
        if (value.hasOwnProperty('line-style') &&
            line_styles.hasOwnProperty(value['line-style']))
            this.context.strokeStyle = line_styles[value['line-style']];
    }
    flush(value) {
        this.context.stroke();
    }
    set_font(value) {
        if (value.hasOwnProperty('font-name'))
            this.context.font = value['font-name'];
    }
    resize(value) {
        if (value.hasOwnProperty('width') && value.hasOwnProperty('height')) {
            this.dialog.parentNode.style.width = value.width + 2 + 'px';
            this.dialog.parentNode.style.height = value.height + 42 + 'px';
            this.canvas.width = value.width;
            this.canvas.height = value.height;
            this.x.range([0, width]);
            this.y.range([height, 0]);
        }
    }
}