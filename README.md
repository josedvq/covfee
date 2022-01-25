# covfee: continuos video feedback tool.

Covfee was created to provide an easily extensible tool for video perception and annotation experiments, especially those requiring continuous feedback from the user.

Full documentation: [covfee docs](https://josedvq.github.io/covfee/)

## Quick start

This document contains instructions for installing covfee locally. We recommend that you work with covfee locally first even if you plan to put it online.

### Setup

1. Install version 12.x of [node.js](https://nodejs.org/en/download/). Make sure that the `npm` command is available in your terminal.

2. Clone this repository and install covfee using pip:

```
git clone git@github.com:josedvq/covfee.git
cd covfee
python3 -m pip install -e .
```

3. Install Javascript dependencies:
```
covfee-installjs
```

### Getting started

Please see the [covfee docs](https://master--5faeef49f6655f00210dbf35.chromatic.com) for an interactive getting started guide.

## Changing covfee
If you wish to change the source code of the backend or make changes to the frontend that are not supported by a custom task, see the [Development guide](docs/development.md).
