const path = require('path')

module.exports = {
  plugins: [
    ["module-resolver", {
      "alias": {
        // these don't work directly in the MDX but they work in imported TSX files
        "@schemata": "../covfee/server/schemata.json",
        "Constants": "./covfee_constants.json",
        "CustomTasks": "./dummy_tasks"
      }
    }],
    "transform-class-properties",
    ["inline-json-import", {}]
  ],
  presets: [require.resolve('@docusaurus/core/lib/babel/preset')],
};
