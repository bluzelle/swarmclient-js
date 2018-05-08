const webpack = require('webpack');

const path = require('path');


const config = require(path.resolve('./webpack.config.js'));


config.entry = {test: path.resolve('./test.js')};

config.plugins.push(new webpack.ProvidePlugin({
    waitFor: 'promise-waitfor'
}));

module.exports = config;
