const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        main: path.resolve(__dirname, 'client', 'main.js')
    },
    output: {
        path: path.resolve(__dirname, 'web', 'build'),
        filename: '[name].js'
    },
    module: {
        loaders: [
            {test: /\.js$/, include: /client/, exclude: /node_modules/, loader: 'babel', query: {presets: ['es2015', 'stage-0']}},
            {test: /\.css$/, loader: ExtractTextPlugin.extract('style', 'css!postcss')},
            {test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url'},
            {test: /\.json$/, loader: 'json'}
        ]
    },
    node: {
        fs: "empty",
    },
    plugins: [
        new ExtractTextPlugin('styles.css')
    ]
};