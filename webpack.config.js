const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        main: path.resolve(__dirname, 'src', 'main.js')
    },
    output: {
        path: path.resolve(__dirname, 'client', 'build'),
        filename: '[name].js'
    },
    module: {
        loaders: [
            {test: /\.js$/, include: /src/, exclude: /node_modules/, loader: 'babel', query: {presets: ['es2015', 'stage-0']}},
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