const path = require("path");
module.exports = {
  "stories": [
    "../app/src/**/*.stories.mdx",
    "../app/src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  "webpackFinal": async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // "Input": path.resolve(__dirname, "../app/src/input/"),
      // "Players": path.resolve(__dirname, "../app/src/players/"),
      "CustomTasks": path.resolve(__dirname, "./dummy_tasks")
    };
    config.resolve.extensions.push(".ts", ".tsx");

    // required by opencv in web target
    config.node = {
      fs: 'empty'
    }
    return config;
  }
}