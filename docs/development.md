# Development setup

This guide explains how to install covfee for development. This is for usage patterns not supported by the normal install, like modifying the backend or making changes to the frontend that go beyond a custom task. A good understanding of Javascript is recommended.

## Setup

The development environment makes use of a webpack development server for a more comfortable experience, including hot-reloading. This guide will get you to run covfee in development mode for one of the sample projects:

1. Install version 12.x of [node.js](https://nodejs.org/en/download/). Make sure that the `npm` command is available in your terminal.

2. Clone this repository and install the python packege with pip, in editable mode. This allows that the changes to the source code immediately affect all the local installations of the package.

```
git clone git@github.com:josedvq/covfee.git
cd covfee
python3 -m pip install -e .
```

3. Create an app database. We will use one of the samples for now:

cd samples/basic
mkcovfee json --fpath basic.covfee.json

4. Fire up webpack:
```
webpack_fb
```
In development mode, webpack serves the front-end code of covfee. That will include the Javascript code of your custom task. Webpack is configured for hot reloading meaning the results will refresh in your browser whenever you make changes to the code. Javascript errors may appear in this terminal or in the browser.

5. In another terminal, start the flask server in dev mode:
```
covfee-dev
```

You can now open the HIT link as explained in the main [README](../README.md)

And that's it. The next section explains how to code a custom task in Javascript.

## Custom tasks

