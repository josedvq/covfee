---
title: Developing custom tasks
---

This guide explains how to install covfee for development. The most common reason to do so is to develop a custom task, but you may also wish to modify the Flask server.

We have tried to make the process of developing a custom annotation task or experiment in covfee as simple as possible. However, development of custom tasks requires at least a basic understanding of Javascript, and [React](https://reactjs.org/). Some useful resources to quickly get started:

- [Official React tutorial](https://reactjs.org/tutorial/tutorial.html)

## Setup

The development environment makes use of a webpack development server for a more comfortable experience, including hot-reloading. This guide will get you to run covfee in development mode for one of the sample projects:

1. Install version 12.x of [node.js](https://nodejs.org/en/download/). Make sure that the `npm` command is available in your terminal.

2. Clone this repository and install the python package with pip, in editable mode. This allows that the changes to the source code immediately affect all the local installations of the package.

```
git clone git@github.com:josedvq/covfee.git
cd covfee
python3 -m pip install -e .
```

3. Create an app database. We will use one of the samples for now:

cd samples/basic
covfee-maker .

4. From the same folder, start webpack:
```
covfee-webpack
```
In development mode, webpack serves the front-end code of covfee. That will include the Javascript code of your custom task. Webpack is configured for hot reloading meaning the results will refresh in your browser whenever you make changes to the code. Javascript errors may appear in this terminal or in the browser.

5. In another terminal, in the same folder, start the flask server in dev mode:
```
covfee-dev
```

You can now open the HIT link as explained in the main [README](../README.md)

And that's it! The next section explains how to code a custom task in Javascript.

## Custom tasks

Custom tasks or HIT types can be added by implementing a React component meeting a few conditions. To be valid, task components must meet these conditions:

1. Be a valid React component, by inheriting from `React.Component`.

2. Covfee takes care of data submission and storage, but your task needs to output the result of the task, ie. the user-provided feedback. This can be, for example, the answer to a form, or the location of the mouse over time. Normally it is enough for you to store the state of the task in the `state` or a class attribute and pass it to the `onSubmit` props method one the task is finished. It is therefore left to you to determine when the task is finished and the data valid. Once `onSubmit` is called, covfee takes control and advances to the next task in the timeline, or lets the user switch to a different one in the annotation environment.

### A first task 
This will walk you through the process of creating a simple covfee task.

We will start by importing the `Form` component, which, quite simply, creates simple forms from a specification. We will also make use of the video.js player to play the videos, and we need to import React and antd for the layout. All these imports look like:

```
import * as React from 'react'
import {
    Row,
    Col,
    Button
} from 'antd';
import VideojsPlayer from '../players/videojs'
import {Form} from 'Input/form'
```

Next, we will create our task component:
```
class FirstTask extends React.Component {

    public state = {
        values: [[]]
    }

    handleChange = (values: object) => {
        const has_null = values[0].some((val) => {
            return val === null
        })

        this.setState({
            values: values,
        })
    }

    handleSubmit = () => {
        this.props.onSubmit(this.state.values)
    }

    render() {
        const mediaOptions = {
            autoplay: false,
            controls: true,
            fluid: true,
            aspectRatio: '16:9',
            sources: [{
                src: this.props.media.url,
                type: 'video/mp4'
            }]
        }
        return <>
            <Row>
                <Col span={16}>
                    <VideojsPlayer {...mediaOptions} onEnded={this.handleVideoEnded}></VideojsPlayer>
                </Col>
                <Col span={8}>
                    <Form {...this.props.form} 
                        values={this.state.form.values} 
                        onChange={this.handleChange}></Form>
                    <Button onClick={this.handleSubmit}>Submit</Button>
                </Col>
            </Row>
        </>
    }
}
```

Task components are located in the `covfee/app/src/tasks` folder. This is the place to start if you wish to implement your own task.