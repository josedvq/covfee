const webpack = require('webpack')
const path = require('path')
module.exports = function (context, options) {
  // ...
  return {
    name: "webpack-config-plugin",
    configureWebpack(config, isServer, utils) {
      return {
        plugins: [
            new webpack.ProvidePlugin({Buffer: ['buffer', 'Buffer']})
        ],
        resolve: {
            // avoids multiple copies of react errors
            'alias': {
                'antd': path.resolve(__dirname, '../node_modules/antd/'),
                'react': path.resolve(__dirname, '../node_modules/react/'),
                'react-dom': path.resolve(__dirname, '../node_modules/react-dom/'),
                'react-router': path.resolve(__dirname, '../node_modules/react-router/'),
                'react-router-dom': path.resolve(__dirname, '../node_modules/react-router-dom/')
            }
        },
        module: {
          rules: [
            {
              test: /\.less$/i,
              use: [ // compiles Less to CSS
                {loader: "style-loader"},
                {loader: "css-loader"},
                {loader: "less-loader", options: { lessOptions: {javascriptEnabled: true}}}
              ],
            }
          ]
        }
      }
    }
  }
}