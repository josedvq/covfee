# covfee: continuos video feedback tool.

Covfee was created to provide an easily extensible tool for video perception and annotation experiments, especially those requiring continuous feedback from the user.

## Quick start

This document contains instructions for installing covfee locally, to test it or to create your experiments locally before putting them online. If you wish to develop a custom task please follow this guide and then see [developing a custom task](custom_task.md)


### Setup

1. Install version 12.x of [node.js](https://nodejs.org/en/download/). Make sure that the `npm` command is available in your terminal.

2. Clone this repository and install the python packege with pip:

```
git clone git@github.com:josedvq/covfee.git
cd covfee
python3 -m pip install .
```

### Getting started

#### 1. Decribe your HITs
The easiest way to get started with covfee is to create a JSON file containing timelines or HITs. Each HIT is a series of tasks that are assigned to a single subject. Examples of tasks are:

- Picking a single label for a video
- Picking multiple labels for a video
- Answering a personality test or survey
- Continuously annotating a video for arousal
- Continuously annotating the position of a hand in a video.

HITs can be as simple as a single one of these tasks, or consist of multiple tasks of different types chained together. You will be able to specify exactly how each HIT will look like. covfee will produce a separate URL per HIT, which can be sent to a study participant. 

You can find examples of JSON files in the [samples folder](../samples). A basic one looks like this:

```
{
    "name": "Example project",
    "email": "example@example.com",
    "timelines": [
        {
            "type": "timeline",
            "tasks": [
                {
                    "type": "QuestionnaireTask",
                    "media": {
                        "type": "video",
                        "url": "1_cam_3.mp4",
                        "mute": true,
                        "autoplay": true,
                        "controls": false
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

This file begins with the `name` and `email` of the contact person in charge of the study, which will be available to participants. The `timelines` section contains an element per HIT, in this case only one. This timeline contains multiple `tasks`, in this case also a single one. The task is of type [`QuestionnaireTask`](), which consists in watching a video or listening to audio and answering questions about it. The video is specified in the `media` property and the form with questions to be answered in the `form` property. See [tasks](tasks/tasks.md) for details on the tasks available and their properties.

#### 2. Create the database
covfee uses the previous JSON specification to create a database that will store the responses to the tasks. To run it for the previous basic sample, assuming you are in the base folder of the repository:

```
cd samples/basic
mkcovfee json --fpath basic.covfee.json
```


#### 3. Annotate!
Running `mkcovfee` should give you an output such as:

```
Example project
ID: c721d8b7f0722ae0f575a8725609e46b1e9421e125dcfa471dc5ebd14e188fb1
 - url: http://127.0.0.1:5000/#/timelines/ebf503d58b3e5a2fb81c22d822d80f1b98d402a44a0c96e04d8f91b2cf531df7
 - api: http://127.0.0.1:5000/api/timelines/ebf503d58b3e5a2fb81c22d822d80f1b98d402a44a0c96e04d8f91b2cf531df7
```

This will contain in general one URL per hit. These are the URLs that you should send to your workers or collaborators. Try opening the first URL in your browser! This should display the HIT you described.

## Developing custom tasks
See [developing a custom task](docs/custom_task.md).
