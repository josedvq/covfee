The develop environment makes use of a webpack development server for easy testing including hot-reloading.

## Setup
Important: this assumes that `python` points to python 3. The best way to ensure this is to use a virtual environment configured to use python3.

To install a development setup:

1. cd to the `covfee` folder.

2. Install python dependencies:

```
python -m pip install -r requirements.txt
```

3. Install version 12.x of [node.js](https://nodejs.org/en/download/).

4. Install npm dependencies (also from the `covfee` folder):
```
    npm config set production false
    npm install
```
5. Create and populate the database with test hits:
```
    npm run reload
```
## Optional requirements
- The optical flow features of continuous keypoint annotation requires [Mozilla Firefox](https://www.mozilla.org/firefox/new/) since it is the only browser to implement the experimental [seekToNextFrame](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seekToNextFrame) function.

## Running

NPM scripts have been set up to run the webpack deb server and the flask server. Both are necessary to run the tool in dev mode.

1. Run the webpack dev server:
```
    npm run webpack-fg
```
2. In another terminal, run the Flask web server:
```
    npm start
```
## Developing a custom task

Timelines in covfee are made up of individual tasks. A task must be submitted by the subject / annotator in order to progress to the next task.

Custom tasks or HIT types can be added by specifying the following components:

- Task component, a React component that takes care of 
