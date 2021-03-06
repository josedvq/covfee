const path = require('path');
const webpack = require('webpack');
const { isObjectLiteralElement } = require('typescript');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = env => {
    return {
        context: __dirname,
        entry: {
            main: './app/src/index.js',
            admin: './app/src/admin/index.js'
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'static'),
            publicPath: 'http://localhost:8085/'
        },
        resolve: {
            extensions: [".ts", ".tsx", ".jsx", ".js"],
            // merge alias.json with the local config.
            'alias': {
                'Tasks': path.resolve(__dirname, 'app/src/tasks'),
                'Players': path.resolve(__dirname, 'app/src/players'),
                'Input': path.resolve(__dirname, 'app/src/input'),
                'Constants': path.resolve(env.COVFEE_WD, 'covfee_constants.json'),
                'CustomTasks': path.resolve(env.COVFEE_WD, 'covfee_tasks'),
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
                            require.resolve("react-hot-loader/babel"),
                            require.resolve("babel-plugin-typescript-to-proptypes")
                        ]
                    }
                },
                {
                    test: /\.svg$/,
                    use: [{
                        loader: 'svg-url-loader',
                        options: {
                            limit: 10000,
                        },
                    }, ],
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader']
                }
            ]
        },
        externals: {
            "react": "React",
            "react-dom": "ReactDOM",
            "antd": "antd",
            "cv": "cv",
            "video.js": "videojs"
        },
        node: {
            fs: 'empty'
        }
    }
}