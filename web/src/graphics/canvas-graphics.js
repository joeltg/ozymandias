/**
 * Created by joel on 7/6/16.
 */


const point_x = 3, point_y = 3;

const drawing_modes = {};
const line_styles = {};

function handle_canvas_graphics_message(message) {
    // console.log(message);
    const {name, action, value} = message;
    if (windows.hasOwnProperty(name)) {
        windows[name][action](value);
    } else if (action === 'create') {
        new CanvasWindow(name, value);
    } else console.error('invalid canvas graphics message');
}

class CanvasWindow extends Window {
    constructor(name, value) {
        ['xmin', 'xmax', 'ymin', 'ymax', 'frame_width', 'frame_height', 'frame_x_position', 'frame_y_position'].forEach(key => value[key] = parseFloat(value[key]));
        const {xmin, xmax, ymin, ymax, frame_width, frame_height, frame_x_position, frame_y_position} = value;
        super(name, false, frame_width, frame_height);
        if (frame_x_position >= 0) this.dialog.parentNode.style.left = frame_x_position;
        if (frame_y_position >= 0) this.dialog.parentNode.style.top = frame_y_position;
        this.canvas = document.createElement('canvas');
        this.canvas.width = frame_width;
        this.canvas.height = frame_height;
        this.dialog.appendChild(this.canvas);
        this.x = d3.scaleLinear().range([0, frame_width]).domain([xmin, xmax]);
        this.y = d3.scaleLinear().range([frame_height, 0]).domain([ymin, ymax]);
        this.context = this.canvas.getContext('2d');
    }
    set_coordinate_limits(value) {
        if (value.hasOwnProperty('x_left') && value.hasOwnProperty('x_right'))
            this.x.domain([parseFloat(value['x_left']), parseFloat(value['x_right'])]);
        if (value.hasOwnProperty('y_top') && value.hasOwnProperty('y_bottom'))
            this.y.domain([parseFloat(value['y_bottom']), parseFloat(value['y_top'])]);
    }
    clear(value) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    draw_point(value) {
        if (value.hasOwnProperty('x') && value.hasOwnProperty('y')) {
            const x = this.x(parseFloat(value.x)) - point_x / 2;
            const y = this.y(parseFloat(value.y)) - point_y / 2;
            this.context.fillRect(x, y, point_x, point_y);
        }
    }
    draw_points(value) {
        if (value.hasOwnProperty('points')) {
            value.points.forEach(([px, py]) => {
                const x = this.x(parseFloat(px)) - point_x / 2;
                const y = this.y(parseFloat(py)) - point_y / 2;
                this.context.fillRect(x, y, point_x, point_y)
            });
        }
    }
    erase_point(value) {
        if (value.hasOwnProperty('x') && value.hasOwnProperty('y')) {
            const x = this.x(parseFloat(value.x)) - point_x;
            const y = this.y(parseFloat(value.y)) - point_y;
            this.context.clearRect(x, y, point_x * 2, point_y * 2);
        }
    }
    draw_line(value) {
        if (value.hasOwnProperty('x_start') && value.hasOwnProperty('x_end') &&
            value.hasOwnProperty('y_start') && value.hasOwnProperty('y_end')) {
            this.context.beginPath();
            const x_start = this.x(value['x_start']) - point_x / 2;
            const y_start = this.y(value['y_start']) - point_y / 2;
            const x_end = this.x(value['x_end']) - point_x / 2;
            const y_end = this.y(value['y_end']) - point_y / 2;
            this.context.moveTo(x_start, y_start);
            this.context.lineTo(x_end, y_end);
            this.context.stroke();
        }
    }
    draw_text(value) {
        if (value.hasOwnProperty('string') && value.hasOwnProperty('x') && value.hasOwnProperty('y')) {
            const x = this.x(value.x) - point_x / 2;
            const y = this.y(value.y) - point_y / 2;
            this.context.fillText(value.string, x, y);
        }
    }
    set_font(value) {
        if (value.hasOwnProperty('font_name'))
            this.context.font = value['font_name'];
    }
    resize(value) {
        if (value.hasOwnProperty('width') && value.hasOwnProperty('height')) {
            const width = parseFloat(value.width), height = parseFloat(value.height);
            this.dialog.parentNode.style.width = width + 2 + 'px';
            this.dialog.parentNode.style.height = height + 42 + 'px';
            this.canvas.width = width;
            this.canvas.height = height;
            this.x.range([0, width]);
            this.y.range([height, 0]);
        }
    }
    rename(value) {
        if (value.hasOwnProperty('name')) {
            delete windows[this.name];
            this.name = value.name;
            windows[this.name] = this;
            $(this.dialog).dialog({title: this.name});
        }
    }
}