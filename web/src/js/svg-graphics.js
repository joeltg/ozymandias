/**
 * Created by joel on 6/19/16.
 */

"use strict";

const dialogs = document.getElementById('dialogs');

const min_window_height = 108, min_window_width = 148;
const default_width = 400, default_height = 300;
const default_domain = [-1, 1];
const windows = {};

function handle_graphics_message(message) {
    console.log(message);
    const {name, actions, points, paths} = message;
    const window = windows[name] || new SVGWindow(name);
    window.paths(paths || []);
    window.points(points || []);
    window.update_axes(points, paths);
    if (actions) actions.forEach(action => window[action]());
}

class SVGWindow {
    constructor(name) {
        windows[name] = this;
        const source = editor.hasFocus() ? editor : repl;
        this.name = name;
        this.id = name.split(' ').join('-');
        this.dialog = document.createElement('div');
        this.dialog.id = 'dialog-' + this.id;
        dialogs.appendChild(this.dialog);

        this.symbols = {};

        this.margin = {top: 20, right: 20, bottom: 40, left: 40, slider: 0};

        this.width = default_width - this.margin.left - this.margin.right;
        this.height = default_height - this.margin.top - this.margin.bottom - this.margin.slider;

        this.xScale = d3.scaleLinear().range([0, this.width]).domain(default_domain).clamp(true);
        this.yScale = d3.scaleLinear().range([this.height, 0]).domain(default_domain).clamp(true);

        this.xAxis = d3.axisBottom(this.xScale)
            .ticks(Math.floor(this.width / 50))
            .tickSizeInner(-this.height)
            .tickSizeOuter(0)
            .tickPadding(10);

        this.yAxis = d3.axisLeft(this.yScale)
            .ticks(Math.floor(this.height / 50))
            .tickSizeInner(-this.width)
            .tickSizeOuter(0)
            .tickPadding(10);

        this.svg = d3.select(this.dialog).append('svg')
            .attr('width', default_width)
            .attr('height', default_height);

        this.svg.on('click', svg => {
            const x = this.xScale.invert(d3.event.offsetX - this.margin.left);
            const y = this.yScale.invert(d3.event.offsetY - this.margin.top);
            const button = d3.event.button;
            const command = `(window-click "${name}" ${x} ${y} ${button})\n`;
            write(command);
            socket.send(JSON.stringify({
                source: 'graphics',
                content: command
            }));
            d3.event.stopPropagation();
        });

        this.content = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        this.content.append('g')
            .attr('class', 'x axis x-axis')
            .attr('transform', `translate(0,${this.height})`)
            .call(this.xAxis);

        this.content.append('g')
            .attr('class', 'y axis y-axis')
            .call(this.yAxis);

        this.line = d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]));

        $(this.dialog).dialog({
            title: name,
            autoOpen: true,
            width: default_width,
            close: () => this.close(),
            resizable: true,
            resize: (event, ui) => {
                const size = ui.size;
                const width = size.width - 2;
                const height = size.height - 42;
                this.resize(width, height);
            }
        });
        source.focus();
    }
    close() {
        if (windows[this.name]) delete windows[this.name];
        $(this.dialog).dialog('destroy');
        this.dialog.parentNode.removeChild(this.dialog);
    }
    clear() {
        this.svg.selectAll('.path').remove();
        this.svg.selectAll('.point').remove();

        this.xScale = d3.scaleLinear().range([0, this.width]).domain(default_domain);
        this.yScale = d3.scaleLinear().range([this.height, 0]).domain(default_domain);

        this.xAxis.scale(this.xScale);
        this.content.select('.x.axis').call(this.xAxis);
        this.yAxis.scale(this.yScale);
        this.svg.select('.y.axis').call(this.yAxis);
    }
    update_axes(points, paths) {
        const x = [], y = [];
        if (points) points.forEach(p => {
            if (isFinite(p.x)) x.push(p.x);
            if (isFinite(p.y)) y.push(p.y);
        });
        if (paths) paths.forEach(path => path.points.forEach(p => {
            if (isFinite(p[0])) x.push(p[0]);
            if (isFinite(p[1])) y.push(p[1]);
        }));

        const x_domain = Window.clamp(d3.extent(x));
        const y_domain = Window.clamp(d3.extent(y));
        this.xScale.domain(x_domain).nice();
        this.yScale.domain(y_domain).nice();

        this.xAxis.scale(this.xScale);
        this.content.select('.x.axis').call(this.xAxis);
        this.yAxis.scale(this.yScale);
        this.content.select('.y.axis').call(this.yAxis);

        this.content.selectAll('.path')
            .attr('d', d => this.line(d.points));
        this.content.selectAll('.point')
            .attr('transform', d => this.translateScale(d));
    }
    translateScale(point) {
        let x = point.x, y = point.y;
        if (!isFinite(x)) {
            if (!point.symbols) point.symbols = {[x]: true};
            else point.symbols[x] = true;
            x = this.symbols.hasOwnProperty(x) ? (this.symbols[x] || 0) : this.add_symbol(x);
        }
        if (!isFinite(y)) {
            if (!point.symbols) point.symbols = {[y]: true};
            else point.symbols[y] = true;
            y = this.symbols.hasOwnProperty(y) ? (this.symbols[y] || 0) : this.add_symbol(y);
        }
        return `translate(${this.xScale(x)},${this.yScale(y)})`;
    }
    translate_along_path(path_id) {
        const path = d3.select(`[uuid='${path_id}']`);
        const line = path.node();
        const length = line.getTotalLength();
        return t => {
            const point = line.getPointAtLength(t * length);
            return `translate(${point.x},${point.y})`;
        }
    }
    translate_over_path(path_id) {
        const path = d3.select(`[uuid='${path_id}']`);
        const points = path.datum().points;
        const length = points.length;
        return t => {
            const index = Math.floor(t * (length - 1));
            const start = points[index];
            if (index < length - 1) {
                const end = points[index + 1];
                const remainder = (t * (length - 1)) - index;
                const x = start[0] + remainder * (end[0] - start[0]);
                const y = start[1] + remainder * (end[1] - start[1]);
                return this.translateScale({x: x, y: y});
            } else return this.translateScale({x: start[0], y: start[1]});
        }
    }
    points(data) {
        const points = this.content.selectAll('.point')
            .data(data, d => d.id)
            .attr('r', d => d.radius + 'px')
            .attr('transform', d => this.translateScale(d))
            .style('fill', d => d.color);

        const new_points = points.enter().append('circle')
            .attr('class', 'point')
            .attr('uuid', d => d.id)
            .attr('r', d => d.radius + 'px')
            .attr('transform', d => this.translateScale(d))
            .style('fill', d => d.color);

        points.merge(new_points).filter(p => !!p.path)
            .transition('animate')
            .duration(p => p.path.duration)
            .ease(d3.easeLinear)
            .attrTween('transform', (d, i, a) => {
                if (d.path.translate === 'over') return this.translate_over_path(d.path.id);
                else return this.translate_along_path(d.path.id);
            });

        const old_points = points.exit().remove();
    }
    paths(data) {
        const paths = this.content.selectAll('.path')
            .data(data, d => d.id)
            .attr('d', d => this.line(d.points))
            .style('fill', d => d.fill)
            .style('stroke-width', d => d.width + 'px')
            .style('stroke', d => d.color);

        const new_paths = paths.enter().append('path')
            .attr('class', 'path')
            .attr('uuid', d => d.id)
            .attr('d', d => this.line(d.points))
            .style('fill', d => d.fill)
            .style('stroke-width', d => d.width + 'px')
            .style('stroke', d => d.color);

        const old_paths = paths.exit().remove();
    }
    resize(width, height) {
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom - this.margin.slider;

        this.svg.attr('width', width).attr('height', height - this.margin.slider);

        this.xScale.range([0, this.width]);
        this.yScale.range([this.height, 0]);

        this.xAxis.scale(this.xScale)
            .ticks(Math.floor(this.width / 50))
            .tickSizeInner(-this.height)
            .tickSizeOuter(0)
            .tickPadding(10);
        this.svg.select('.x.axis')
            .call(this.xAxis)
            .attr("transform", `translate(0,${this.height})`);

        this.yAxis.scale(this.yScale)
            .ticks(Math.floor(this.height / 50))
            .tickSizeInner(-this.width)
            .tickSizeOuter(0)
            .tickPadding(10);
        this.svg.select('.y.axis')
            .call(this.yAxis);

        this.svg.selectAll('.path')
            .attr('d', d => this.line(d.points));
        this.svg.selectAll('.point')
            .attr('transform', d => this.translateScale(d));

        d3.select(this.dialog).selectAll('.slider-tray')
            .style('width', this.width + 'px');
        d3.select(this.dialog).selectAll('.slider')
            .style('width', this.width + 'px');
    }
    scale() {
        const d_x = this.xScale.domain(), d_y = this.yScale.domain();
        const d_width = Math.abs(d_x[1] - d_x[0]), d_height = Math.abs(d_y[1] - d_y[0]);
        const d_scale = d_width / d_height;
        const r_x = this.xScale.range(), r_y = this.yScale.range();
        const r_width = Math.abs(r_x[1] - r_x[0]), r_height = Math.abs(r_y[1] - r_y[0]);
        const r_scale = r_width / r_height;
        let width = r_width, height = r_height;
        if (d_scale > r_scale) height = width / d_scale;
        else width = height * d_scale;
        width = Math.max(width, min_window_width) + this.margin.left + this.margin.right;
        height = Math.max(height, min_window_height) + this.margin.top + this.margin.bottom + this.margin.slider;
        this.dialog.parentNode.style.width = width + 2 + 'px';
        this.dialog.parentNode.style.height = height + 42 + 'px';
        this.resize(width, height);
    }
    static normalize(a) {
        return a ? [a[0] || default_domain[0], a[1] || default_domain[1]] : default_domain;
    }
    static clamp(a, b) {
        a = Window.normalize(a);
        b = Window.normalize(b);
        return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
    }
    static walk(tree, callback) {
        tree.slice(1).forEach(arg => {
            if (arg) switch (typeof(arg)) {
                case 'string':
                    callback(arg);
                    return;
                case 'number':
                    return;
                case 'object':
                    Window.walk(arg, callback);
                    return;
                default:
                    console.error('unrecognized tree node');
            }
        })
    }
    add_symbol(symbol) {
        const domain = this.xScale.domain();
        if (symbol instanceof Array) {
            if (symbol[0] === '*number*' && symbol[1] instanceof Array && symbol[1][0] === 'expression') {
                console.log('walking on', symbol[1][1]);
                Window.walk(symbol[1][1], arg => this.add_symbol(arg));
                return this.symbols[symbol] = domain[0];
            } else return console.error('variable not recognized');
        }
        if (this.symbols.hasOwnProperty(symbol)) return this.symbols[symbol];
        this.symbols[symbol] = domain[0];
        this.margin.slider += 40;
        this.resize(this.width + this.margin.left + this.margin.right,
                    this.height + this.margin.top + this.margin.bottom + this.margin.slider);

        const dialog = d3.select(this.dialog);
        const label = dialog.append('div')
            .attr('class', 'label')
            .style('margin-left', this.margin.left + 'px')
            .text(symbol + (': ' + domain[0]).substring(0, 7));
        const slider = dialog.append('div')
            .attr('class', 'slider')
            .style('width', this.width + 'px');
        const sliderTray = slider.append("div")
            .attr("class", "slider-tray")
            .style('width', this.width + 'px')
            .style('margin-left', this.margin.left + 'px');
        const sliderHandle = slider.append("div")
            .attr("class", "slider-handle")
            .style('left', this.margin.left + 'px');
        sliderHandle.append("div")
            .attr("class", "slider-handle-icon");

        const scale = this.xScale;

        slider.call(d3.drag()
            .on("start", () => {
                const value = scale.invert(d3.mouse(sliderTray.node())[0]);
                label.text(symbol + (': ' + value).substring(0, 7));
                this.symbols[symbol] = value;
                sliderHandle.style('left', scale(value) + this.margin.left + 'px');
                // this.content.selectAll('.point')
                //     // .filter(p => p.symbols && p.symbols[symbol])
                //     .attr('transform', p => this.translateScale(p));
            })
            .on("drag", () => {
                const value = scale.invert(d3.mouse(sliderTray.node())[0]);
                label.text(symbol + (': ' + value).substring(0, 7));
                this.symbols[symbol] = value;
                sliderHandle.style('left', scale(value) + this.margin.left + 'px');
                // this.content.selectAll('.point')
                //     // .filter(p => p.symbols && p.symbols[symbol])
                //     .attr('transform', d => this.translateScale(d));

                const variables = Object.keys(this.symbols)
                    .filter(key => key.substring(0, 19) !== "*number*,expression")
                    .map(key => `(${key} ${this.symbols[key]})`).join(' ');
                const command = `(window-evaluate "${this.name}" '(${variables}))\n`;
                write(command);
                socket.send(JSON.stringify({
                    source: 'graphics',
                    content: command
                }));
            })
            .on("end", () => {
                const variables = Object.keys(this.symbols)
                    .filter(key => key.substring(0, 19) !== "*number*,expression")
                    .map(key => `(${key} ${this.symbols[key]})`).join(' ');
                const command = `(window-evaluate "${this.name}" '(${variables}))\n`;
                write(command);
                socket.send(JSON.stringify({
                    source: 'graphics',
                    content: command
                }));
            })
        );

        return domain[0];
    }
}
