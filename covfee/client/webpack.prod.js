const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = env => {
    return merge(common(env), {
        output: {
            publicPath: 'http://localhost:5000/www/'
        },
        mode: 'production'
    })
}