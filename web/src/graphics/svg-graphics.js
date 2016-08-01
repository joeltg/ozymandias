/**
 * Created by joel on 6/19/16.
 */

'use strict';

const min_window_height = 108, min_window_width = 148;
const slider_spacing = 30;
const default_domain = [-1, 1];
const grid_density = 50;

function handle_svg_graphics_message(message) {
    const {name, points, env} = message;
    const window = windows[name] || new SVGWindow(name);
    window.update(points || [], env || {});
}

class SVGWindow extends Window {
    constructor(name) {
        super(name, true);
        this.env_scales = {};
	
        this.margin = {top: 20, right: 20, bottom: 40, left: 40, slider: 0};

        this.width = default_width;
        this.height = default_height;
	
        this.xScale = d3.scaleLinear().range([0, this.content_width]).domain(default_domain).clamp(true);
        this.yScale = d3.scaleLinear().range([this.content_height, 0]).domain(default_domain).clamp(true);
	
        this.xAxis = d3.axisBottom(this.xScale)
            .ticks(Math.floor(this.content_width / grid_density))
            .tickSizeInner(-this.content_height)
            .tickSizeOuter(0)
            .tickPadding(10);
        this.yAxis = d3.axisLeft(this.yScale)
            .ticks(Math.floor(this.content_height / grid_density))
            .tickSizeInner(-this.content_width)
            .tickSizeOuter(0)
            .tickPadding(10);
	
        this.svg = d3.select(this.dialog).append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
	
        this.content = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
	
        this.content.append('g')
            .attr('class', 'x axis x-axis')
            .attr('transform', `translate(0,${this.content_height})`)
            .call(this.xAxis);
        this.content.append('g')
            .attr('class', 'y axis y-axis')
            .call(this.yAxis);

        this.sliders = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.height - this.margin.slider})`);
    }
    clear() {
        this.svg.selectAll('.point').remove();
        this.xScale = d3.scaleLinear().range([0, this.width]).domain(default_domain);
        this.yScale = d3.scaleLinear().range([this.height, 0]).domain(default_domain);
        this.xAxis.scale(this.xScale);
        this.content.select('.x.axis').call(this.xAxis);
        this.yAxis.scale(this.yScale);
        this.svg.select('.y.axis').call(this.yAxis);
    }
    translate_point([id, x, y]) {
        return `translate(${this.xScale(x)},${this.yScale(y)})`;
    }
    points(data) {
        const points = this.content.selectAll('.point')
            .data(data, ([id]) => id)
            .attr('transform', d => this.translate_point(d));
        const new_points = points.enter().append('circle')
            .attr('class', 'point')
            .attr('r', '4px')
            .attr('transform', d => this.translate_point(d))
            .call(d3.drag()
                .on("start", d => null)
                .on("drag", d => this.update_point(d, d3.event))
                .on("end", d => this.update_point(d, d3.event)));
        const old_points = points.exit().remove();
    }

    make_symbol_scale(d) {
        this.env_scales[d] = d3.scaleLinear().range([0, this.content_width]).domain(default_domain).clamp(true);
    }

    symbols(env) {
        const symbols = this.sliders.selectAll('.slider').data(Object.keys(env));

        symbols.selectAll('.handle')
            .attr('transform', d => `translate(${this.env_scales[d](env[d])},0)`);

        const new_symbols = symbols.enter().append('g')
            .attr('class', 'slider')
            .attr('transform', (d, i) => `translate(${this.margin.left},${slider_spacing * (i + 0.5)})`)
            .each(d => this.make_symbol_scale(d));
        new_symbols.append('line')
            .attr('class', 'track')
            .attr('x1', '0')
            .attr('y1', '0')
            .attr('x2', this.content_width)
            .attr('y2', '0');
            // .attr('transform', `translate(${this.margin.left},0)`)

        new_symbols.append('circle')
            .attr('class', 'handle')
            .attr('r', 9)
            .attr('transform', d => `translate(${this.env_scales[d](env[d])},0)`)
            .call(d3.drag()
                // .on("start", function(d, i, v) {console.log(d3.event, this, d, i, v)})
                // .on("drag", function (d, i, n) {d3.select(this).attr('transform', `translate(${d3.event.x},0)`)})
                .on("drag", d => this.update_env(d, d3.event))
                .on("end", d => this.update_env(d, d3.event)));

        const old_symbols = symbols.exit().remove().each(d => delete env[d]);

        this.margin.slider = Object.keys(env).length * slider_spacing;
        this.resize(this.width, this.height);
    }

    update_point([id], {x, y}) {
        const text = `(update-point "${this.name}" ${id} ${this.xScale.invert(x)} ${this.yScale.invert(y)})\n`;
        if (!repl.waiting) push_repl(text, true);
    }

    update_env(key, {x}) {
        const val = this.env_scales[key].invert(x);
        if (!repl.waiting) push_repl(`(update-env "${this.name}" '${key} ${val})\n`, true);
    }

    update(points, env) {
        const symbols = Object.keys(env);
        this.margin.slider = symbols.length * slider_spacing;
        this.points(points);
        this.symbols(env);
    }
    get content_width() {
        return this.width - this.margin.left - this.margin.right;
    }
    get content_height() {
        return this.height - this.margin.top - this.margin.bottom - this.margin.slider;
    }
    resize(width, height) {
        this.width = width;
        this.height = height;

        this.svg.attr('width', this.width).attr('height', this.height);

        this.xScale.range([0, this.content_width]);
        this.yScale.range([this.content_height, 0]);

        this.xAxis.scale(this.xScale)
            .ticks(Math.floor(this.content_width / grid_density))
            .tickSizeInner(-this.content_height)
            .tickSizeOuter(0)
            .tickPadding(10);
        this.svg.select('.x.axis')
            .call(this.xAxis)
            .attr('transform', `translate(0,${this.content_height})`);

        this.yAxis.scale(this.yScale)
            .ticks(Math.floor(this.content_height / grid_density))
            .tickSizeInner(-this.content_width)
            .tickSizeOuter(0)
            .tickPadding(10);
        this.svg.select('.y.axis')
            .call(this.yAxis);

        this.svg.selectAll('.point')
            .attr('transform', d => this.translate_point(d));

        this.sliders.attr('transform', `translate(0,${this.height - this.margin.slider})`);
        this.sliders.selectAll('.slider')
            .each(d => this.env_scales[d].range([0, this.content_width]));
        this.sliders.selectAll('.track')
            .attr('x2', this.content_width);
        // this.sliders.selectAll('.handle')
        //     .attr('transform', d => `translate(${this.env_scales[d](d.val)},0)`);
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
        a = SVGWindow.normalize(a);
        b = SVGWindow.normalize(b);
        return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
    }
}
