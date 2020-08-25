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
3. Now you should be ready to open a timeline. A timeline is a sequence of tasks / HITs to be completed by an annotator. Timelines are hidden from being public by using a hash as URL. A few sample timelines were created when you ran `npm run reload`. You may run it again to see the created timelines. The output will look like this:

```
Continuous annot sample
ID: 8cd7726db25d22c93d24f91a7de14e588ae680c57eecf6efdb850bd572d295f7
 - url: http://127.0.0.1:5000/#/timelines/8e33388d55eb585b73160a165e3a0676c10c8aef8fb4740104a38e3741d8d272

Test project
ID: eb3f046b10a2892c3ad6215b14815e04f565bd960f490b388ea9d1031827e29a
 - url: http://127.0.0.1:5000/#/timelines/b9003503053bd1c0a2ca3530a96215b5f2d75a764b7ac38228b26b31b8ac5926
 - url: http://127.0.0.1:5000/#/timelines/34793139aaf879bb402a137a28d718d14e828e0f24ef476a050ca401bc5d6937
```

The continuous annotation sample should work out of the box. Try the URL.

## Developing a custom task

Note: development of custom tasks requires at least a basic understanding of [React](https://reactjs.org/). Some useful resources to quickly get started:

- [Official React tutorial](https://reactjs.org/tutorial/tutorial.html)

Timelines in covfee are made up of individual tasks / HITs. Examples of tasks are:

- Picking a single label for a video
- Picking multiple labels for a video
- Answering a personality test or survey
- Continuously annotating a video for arousal

A task must be submitted by the subject / annotator in order to progress to the next task in the timeline. Timelines may have a single task.

Custom tasks or HIT types can be added by implementing a React component meeting a few conditions. To be valid, task components must meet these conditions:

1. Be a valid React component, by inheriting from `React.Component`.

2. Return a `Task` component from its render() method, and pass its props and `validate` method to it. For example, the Questionnaire task includes:

```
import Task from './task'
...
return <Task {...this.props } validate = { this.validate.bind(this) } >
    <Row gutter={16}>
        <Col span={16}>
            <VideojsPlayer {...videoJsOptions}></VideojsPlayer>
        </Col>
        <Col span={8}>
            <Form {...this.props.form} values={this.state.form.values} onChange={this.handleChange.bind(this)}></Form>
            <Task.Submit disabled={!this.state.form.completed}></Task.Submit>
        </Col>
    </Row>
    <Row gutter={16}>
        <pre>
            {JSON.stringify(this.props.form, null, 2)}
        </pre>
    </Row>
</Task>
```

Task components are located in the `covfee/app/src/tasks` folder. Feel free to inspect other examples.
New task components must be included in the `covfee/app/src/tasks/index.js` file to be visible to the main React app.

