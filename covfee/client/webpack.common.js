const path = require('path');
const webpack = require('webpack')

module.exports = env => {
    return {
        context: __dirname,
        entry: {
            main: './index.js',
            admin: './admin/index.js'
        },
        output: {
            filename: '[name].js'            
        },
        resolve: {
            extensions: [".ts", ".tsx", ".jsx", ".js"],
            modules: ['node_modules'],
            fallback: {
                util: require.resolve("util")
            }
        },
        module: {
            rules: [
                {
                    test: /\.(jsx|tsx|js|ts)$/,
                    loader: require.resolve('babel-loader'),
                    exclude: /(node_modules|bower_components)/,
                    options: {
                        presets: [
                            require.resolve("@babel/preset-typescript"),
                            [
                                require.resolve("@babel/preset-env"),
                                {
                                    "modules": false
                                }
                            ],
                            require.resolve("@babel/preset-react")
                        ],
                        plugins: [
                            require.resolve("@babel/plugin-proposal-class-properties"),
                        ]
                    }
                },
                {
                    test: /\.svg$/,
                    use: ['@svgr/webpack']
                },
                {
                    test: /\.(scss|css)$/,
                    use: ['style-loader', 'css-loader', 'sass-loader'],
                }
            ]
        },
        plugins: [
            new webpack.ProvidePlugin({
                Buffer: [require.resolve("buffer/"), "Buffer"],
            }),
        ],
        externals: {
            "cv": "cv",
            "video.js": "videojs",
            "Constants": "Constants"
        }
    }
}