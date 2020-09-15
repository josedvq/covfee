const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './app/dist',
        headers: { 'Access-Control-Allow-Origin': '*' },
        hot: true,
        overlay: true,
        inline: true,
        port: 8085,
        open: false
    },
    plugins: [
        new BundleAnalyzerPlugin()
    ]
});