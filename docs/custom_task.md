# Developing a custom task
This guide explains how to install covfee for development. The most common reason to do so is to develop a custom task, but you may also wish to modify the Flask server.

We have tried to make the process of developing a custom annotation task or experiment in covfee as simple as possible. However, development of custom tasks requires at least a basic understanding of Javascript, and [React](https://reactjs.org/). Some useful resources to quickly get started:

- [Official React tutorial](https://reactjs.org/tutorial/tutorial.html)

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

The `props` object can be passed as in `<Task {...this.props } `. If you prefer to only pass the necessary props, these are `submit_url` and `onSubmit`. The `validate` will be called when the "Next" button is pressed by the user to submit the task. This method allows you to implement validation functionallity before the result of the task is submitted to the server. It can be used to ensure that the filled-in data is complete and otherwise valid and trigger feedback to the user if the data is incomplete or invalid.

- If the data is invalid, the method should trigger the necessary state changes and return false. Nothing will be submitted to the server.
- If the data is valid, this method should simply (synchronously) return the result of completing the task. This will be sent to the server as-is and stored in JSON format as the task result. For the Questionnaire task, this is simply the state of the form elements:

```
validate() {
    return this.state.form.values
}
```

Note that the validate method is not meant to be used for server-side validation. Server-side validation is not supported in the current workflow. Finally, make sure to bind your validate method before passing it to `Task`.

Task components are located in the `covfee/app/src/tasks` folder. Feel free to inspect other examples.
New task components must be included in the `covfee/app/src/tasks/index.js` file to be visible to the main React app.