const path = require("path");
module.exports = {
  "stories": [
    "../docs/**/*.stories.mdx",
    "../client/**/*.stories.mdx",
    "../client/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs",
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  "webpackFinal": async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // "Input": path.resolve(__dirname, "../app/src/input/"),
      // "Players": path.resolve(__dirname, "../app/src/players/"),
      "Constants": path.resolve(__dirname, "./covfee_constants.json"),
      "CustomTasks": path.resolve(__dirname, "./dummy_tasks"),
      "@docs": path.resolve(__dirname, "../docs"),
      "@client": path.resolve(__dirname, "../client"),
      "@server": path.resolve(__dirname, "../server"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@covfee-types": path.resolve(__dirname, "../shared/types")
    };
    config.resolve.extensions.push(".ts", ".tsx");

    // required by opencv in web target
    config.node = {
      fs: 'empty'
    }
    return config;
  }
}