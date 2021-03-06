const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = env => {
    return merge(common(env), {
        mode: 'development',
        devtool: 'inline-source-map',
        devServer: {
            contentBase: './app/dist',
            headers: { 
                'Access-Control-Allow-Origin': '*' ,
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
            },
            hot: true,
            overlay: true,
            inline: true,
            port: 8085,
            open: false
        },
        plugins: [
            // new BundleAnalyzerPlugin()
        ]
    })
}