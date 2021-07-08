const path = require('path')

module.exports = {
  plugins: [
    ["module-resolver", {
      "alias": {
        // these don't work directly in the MDX but they work in imported TSX files
        "@schemata": "../covfee/shared/schemata.json",
        "Constants": "./covfee_constants.json"
      }
    }],
    "transform-class-properties",
    ["inline-json-import", {}]
  ],
  presets: [require.resolve('@docusaurus/core/lib/babel/preset')],
};
