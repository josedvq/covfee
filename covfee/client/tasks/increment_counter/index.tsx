import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { BasicTaskProps, CovfeeTask } from '../base'

import { VideocallTaskSpec } from '@covfee-shared/spec/tasks/videocall'
import { TaskType } from '@covfee-shared/spec/task'
import {useNodeState} from '../../nodes/state'
import { State } from './slice'
import {slice, actions} from './slice'

interface Props extends TaskType, BasicTaskProps {
}


function IncrementCounterTask(props: Props) {
    const {state, dispatch} = useNodeState<State>(slice)

    return <>
        <h1>Counter {state.counter}</h1>

        <button onClick={()=>{dispatch(actions.incrementValue())}}>Increment</button>
    </>
}


export default {taskConstructor: IncrementCounterTask, taskReducer: reducer}