# covfee: continuos video feedback tool.

Covfee was created to provide an easily extensible tool for video perception and annotation experiments, especially those requiring continuous feedback from the user.

Full documentation: [COVFEE DOCS](https://<branch>--5faeef49f6655f00210dbf35.chromatic.com)

## Quick start

This document contains instructions for installing covfee locally, to test it or to create your experiments locally before putting them online. If you wish to develop a custom task please follow this guide and then see [developing a custom task](custom_task.md)


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

#### 1. Decribe your HITs
The easiest way to get started with covfee is to create a JSON file containing timelines or HITs. Each HIT is a set of tasks that are assigned to a single subject. Examples of tasks are:

- Picking a single label for a video
- Picking multiple labels for a video
- Answering a personality test or survey
- Continuously annotating a video for arousal
- Continuously annotating the position of a hand in a video.

HITs can be as simple as a single one of these tasks, or consist of multiple tasks of different types. You are able to specify exactly what tasks are part of each HIT. covfee will produce a separate URL per HIT, which can be sent to a study participant. 

There are two types of HITs: timeline and annotation HITs.

- **Timeline HITs** are a sequence of tasks, which must be completed in order by study subjects. Timeline HITs would normally be used for perception studies, where a subject must complete a series of tasks to complete participation. 
- **Annotation HITs** are a set of tasks in no particular order, and are meant to be used mainly for annotation of continuous variables. It is especially meant for use online with Mechanical Turk and similar platforms. An annotation HIT is used to annotate a single media file (all its tasks will refer to the same audio/video file). Predefined tasks can be set to be completed by annotators. Annotators can also be allowed to create and name their own tasks. These HITs will be rendered in an annotation interface where users can control the available continuous variables.

A JSON file is the easiest way to specify your HITs. You can find examples of such JSON files in the [samples folder](../samples). A basic timeline HIT looks like this:

```
{
    "name": "Example project",
    "email": "example@example.com",
    "hits": [
        {
            "type": "timeline",
            "tasks": [
                {
                    "type": "QuestionnaireTask",
                    "media": {
                        "type": "video",
                        "url": "video.mp4",
                    },
                    "form": {
                        "fields": [
                            {
                                "prompt": "Does the person in the video laugh?",
                                "input": {
                                    "type": "radio",
                                    "options": ["yes", "no"]
                                }
                            }
                        ]
                    }
                }
            ]
        }
    ]
}
```

This file begins with the `name` and `email` of the contact person in charge of the study, which will be available to participants. The `hits` section contains an element per HIT, in this case only one. This timeline contains multiple `tasks`, in this case also a single one. The task is of type [`QuestionnaireTask`], which consists in watching a video or listening to audio and answering questions about it. The video is specified in the `media` property and the form with questions to be answered in the `form` property. See [tasks](tasks/tasks.md) for details on the tasks available and their properties.

#### 2. Create the database
covfee uses the previous JSON specification to create a database that will store the responses to the tasks. To run it for the previous basic sample, assuming you are in the base folder of the repository:

```
cd samples/basic
covfee-maker .
```

#### 3. Run covfee
Run the following two commands in separate terminals. Both should be run from your project directory (eg. `samples/basic`)
```
covfee-webpack
covfee-dev
```

#### 4. Annotate!
Running `covfee-maker` should have given you an output such as:

```
Example project
ID: c721d8b7f0722ae0f575a8725609e46b1e9421e125dcfa471dc5ebd14e188fb1
 - url: http://127.0.0.1:5000/#/timelines/ebf503d58b3e5a2fb81c22d822d80f1b98d402a44a0c96e04d8f91b2cf531df7
 - api: http://127.0.0.1:5000/api/timelines/ebf503d58b3e5a2fb81c22d822d80f1b98d402a44a0c96e04d8f91b2cf531df7
```

This will contain in general one URL per hit. These are the URLs that you should send to your workers or collaborators. Try opening the first URL in your browser! This should display the HIT you described.

## Developing custom tasks

We have tried to make the process of developing a custom annotation task as simple as possible. However, development of custom tasks requires at least a basic understanding of Javascript, and [React](https://reactjs.org/). Some useful resources to quickly get started:

- [Official React tutorial](https://reactjs.org/tutorial/tutorial.html)


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

## Changing covfee
If you wish to change the source code of the backend or make changes to the frontend that are not supported by a custom task, see the [Development guide](docs/development.md).
