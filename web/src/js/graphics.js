/**
 * Created by joel on 6/19/16.
 */

"use strict";

const dialogs = document.getElementById('dialogs');

const min_window_height = 108, min_window_width = 148;
const default_width = 400, default_height = 300;
const default_domain = [0, 1];
const windows = {};

function handle_graphics_message(message) {
    console.log(message);
    const {name, actions, points, paths} = message;
    const window = windows[name] || new Window(name);
    window.paths(paths || []);
    window.points(points || []);
    window.update_axes(points, paths);
    if (actions) actions.forEach(action => window[action]());
}

class Window {
    constructor(name) {
        windows[name] = this;
        this.name = name;
        this.id = name.split(' ').join('-');
        this.dialog = document.createElement('div');
        this.dialog.id = 'dialog-' + this.id;
        this.symbols = {};
        this.callbacks = [(x, y) => console.log(x, y)];
        dialogs.appendChild(this.dialog);

        this.margin = {top: 20, right: 20, bottom: 40, left: 40};

        this.width = default_width - this.margin.left - this.margin.right;
        this.height = default_height - this.margin.top - this.margin.bottom;

        this.xScale = d3.scaleLinear().range([0, this.width]).domain(default_domain);
        this.yScale = d3.scaleLinear().range([this.height, 0]).domain(default_domain);

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
        if (points) points.forEach(p => {x.push(p.x); y.push(p.y)});
        if (paths) paths.forEach(path => path.points.forEach(p => {x.push(p[0]); y.push(p[1])}));

        this.xScale.domain(Window.clamp(d3.extent(x))).nice();
        this.yScale.domain(Window.clamp(d3.extent(y))).nice();

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
        const x = this.xScale(point.x), y = this.yScale(point.y);
        return `translate(${x},${y})`;
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
            .attr('r', d => d.radius)
            .attr('transform', d => this.translateScale(d))
            .style('fill', d => d.color);

        const new_points = points.enter().append('circle')
            .attr('class', 'point')
            .attr('uuid', d => d.id)
            .attr('r', d => d.radius)
            .attr('transform', d => this.translateScale(d))
            .style('fill', d => d.color);

        points.filter(p => !!p.path).merge(new_points.filter(p => !!p.path))
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
            .style('stroke-width', d => d.width)
            .style('stroke', d => d.color);

        const new_paths = paths.enter().append('path')
            .attr('class', 'path')
            .attr('uuid', d => d.id)
            .attr('d', d => this.line(d.points))
            .style('fill', d => d.fill)
            .style('stroke-width', d => d.width)
            .style('stroke', d => d.color);

        const old_paths = paths.exit().remove();
    }
    resize(width, height) {
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;

        this.svg.attr('width', width).attr('height', height);

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
        height = Math.max(height, min_window_height) + this.margin.top + this.margin.bottom;
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
}