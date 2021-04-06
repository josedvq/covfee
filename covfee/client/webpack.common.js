const path = require('path');

module.exports = env => {

    const customTasksPaths = [path.resolve(__dirname, 'tasks/dummy_custom_tasks')]
    if(env.COVFEE_WD) customTasksPaths.unshift(path.resolve(env.COVFEE_WD, 'covfee_tasks'))

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
            'alias': {
                'CustomTasks': customTasksPaths,
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
            "video.js": "videojs",
            "Constants": "Constants"
        }
    }
}