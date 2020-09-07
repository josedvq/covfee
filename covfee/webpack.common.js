const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = {
    entry: ['./app/src/index.js'],
    resolve: {
        extensions: [".ts", ".tsx", ".jsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'babel-loader',
                exclude: /(node_modules|bower_components)/,
            },
            {
                test: /\.css$/i,
                exclude: /(node_modules|bower_components)/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: 'babel-loader'
            },
        ]
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'app/dist'),
        publicPath: 'http://localhost:8080/'
    },
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "antd": "antd",
        "cv": "cv",
        "video.js": "videojs"
    }
}