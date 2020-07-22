import React from 'react';
import {
    Switch,
    Route,
    Link
} from "react-router-dom";
import { withRouter } from 'react-router'
import {
    LoadingOutlined 
} from '@ant-design/icons';

import { ChunkAnnotationTask, ContinuousAnnotationTask, ContinuousPointAnnotationTask} from './task';
import Constants from '../constants'

class Timeline extends React.Component {
    state: any
    timeline: any
    id: number
    url: string

    constructor(props: any) {
        super(props);
        this.state = {
            loaded: false,
            curr_task: 0
        }
    }

    nextTask() {
        this.setState({
            curr_task: this.state.curr_task + 1
        })
    }

    componentDidMount() {
        this.id = this.props.match.params.timelineId
        this.url = Constants.api_url + '/timelines/' + this.id

        fetch(this.url)
            .then(res => res.json())
            .then(
                (result) => {
                    console.log(result)
                    this.timeline = result;
                    this.setState({
                        loaded: true
                    });
                    console.log(this.timeline)
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    this.setState({
                        loaded: true,
                        error
                    });
                }
            )
    }

    render() {
        if (this.state.loaded == false) {
            return <LoadingOutlined />
        } else {
            const props = this.timeline.tasks[this.state.curr_task]
            props.url = this.timeline.url_prefix + '/' + props.url
            props.submit_url = this.url + '/tasks' + props.id + '/chunk'
            switch (props.type) {
                case 'video':
                    return <ContinuousPointAnnotationTask {...props}></ContinuousPointAnnotationTask>
                case 'continuous':
                    return <ContinuousAnnotationTask {...props}></ContinuousAnnotationTask>
                default:
                    return
            }
        }
    }
}

const TimelineWithRouter = withRouter(Timeline);

export { TimelineWithRouter }