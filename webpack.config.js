const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        bundle: path.resolve(__dirname, 'src', 'main.js')
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js'
    },
    module: {
        loaders: [
            {test: /\.js$/, include: /src/, exclude: /node_modules/, loader: 'babel-loader', query: {presets: ['es2015', 'stage-0']}},
            // {test: /\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader')},
            {test: /\.css$/, loader: ExtractTextPlugin.extract('css-loader')},
            {test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader'},
            {test: /\.json$/, loader: 'json-loader'}
        ]
    },
    node: {
        fs: "empty",
    },
    plugins: [
        new ExtractTextPlugin('bundle.css')
    ],
    target: "electron-renderer"
};