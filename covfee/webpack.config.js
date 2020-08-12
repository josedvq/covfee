const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = [
    // main app
    {
        mode: 'development',
        entry: ['react-hot-loader/patch', './app/src/index.js'],
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
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.m?js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: [
                        {loader: 'react-hot-loader/webpack'},
                        {loader: 'babel-loader'}
                    ]
                },
            ]
        },
        devtool: 'inline-source-map',
        devServer: {
            contentBase: './app/dist',
            headers: { 'Access-Control-Allow-Origin': '*' },
            hot: true,
            inline: true
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
            "cv": "cv"
        },
        plugins: [
            new BundleAnalyzerPlugin()
        ]
    }
];