const path = require('path')

exports.onCreateWebpackConfig = args => {
    args.actions.setWebpackConfig({
        resolve: {
            modules: [path.resolve(__dirname, '../src'), 'node_modules'],
            alias: {
                'Tasks': path.resolve(__dirname, '../app/src/tasks')
                // 'Players': path.resolve(__dirname, '../app/src/tasks'),
                // 'Input': path.resolve(__dirname, '../app/src/tasks')
            }
        },
        externals: {
            "antd": "antd",
            "cv": "cv",
            "video.js": "videojs"
        }
    })
}