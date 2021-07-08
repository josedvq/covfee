import * as React from 'react'
import {
    Row,
    Col,
    Alert
} from 'antd'
import { BaseTaskProps, CovfeeTask } from './base'
import { VideocallTaskSpec } from '@covfee-types/tasks/videocall'
import { TaskType } from '@covfee-types/task'

interface Props extends TaskType, BaseTaskProps {
    spec: VideocallTaskSpec
}

interface State {
}

export class VideocallTask extends CovfeeTask<Props, State> {

    state: State = {
    }

    constructor(props: Props) {
        super(props)
    }

    render() {
        return <>
            
        </>
    }
}

export default VideocallTask