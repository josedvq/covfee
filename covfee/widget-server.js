const WebpackDevServer = require("webpack-dev-server")
const webpack = require("webpack")
const config = require("./webpack.config")

const compiler = webpack(config)

const server = new WebpackDevServer(compiler.compilers[1], compiler.compilers[1].options.devServer)

server.listen(compiler.compilers[1].options.devServer.port, "localhost", function () { })