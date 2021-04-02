const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = env => {
    return merge(common(env), {
        mode: 'development',
        output: {
            publicPath: 'http://localhost:8085/'
        },
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
            
        ]
    })
}