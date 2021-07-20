import * as React from 'react'
import { Button } from 'antd'
import {useSelector, useDispatch} from 'react-redux'
import { BasicTaskProps, CovfeeTask } from './base'

import { VideocallTaskSpec } from '@covfee-types/tasks/videocall'
import { TaskType } from '@covfee-types/task'

import reducer, {incrementValue} from './videocallSlice'


interface Props extends TaskType, BasicTaskProps {
    spec: VideocallTaskSpec
}

interface State {
}

function VideocallTask(props: Props) {

    const dispatch = useDispatch()
    const state = useSelector(s => s.task)

    const increment = () => {
        dispatch(incrementValue())
    }

    return <>
        <h1>{state.queryIdx}</h1>
        <Button onClick={increment}>Increment</Button>
    </>
}

export default {taskConstructor: VideocallTask, taskReducer: reducer}