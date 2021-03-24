import * as React from 'react'
import {
    HashRouter
} from 'react-router-dom'
import Hit from '@client/hit'

export interface HITVisualizerProps {
    hit: HITSpec
}

export interface HITVisualizerState {
}

export class HITVisualizer extends React.Component<HITVisualizerProps, HITVisualizerState> {

    state: HITVisualizerState = {
    }

    constructor(props: HITVisualizerProps) {
        super(props)
    }

    render() {
        // add id to each task
        let hitProps = JSON.parse(JSON.stringify(this.props.hit))
        hitProps.tasks = hitProps.tasks.map((task, idx) => {
            task.id = idx
            return task
        })

        const content = <Hit
            {...hitProps}
            url={null}
            previewMode={true}
            onSubmit={() => { }} />

        return <HashRouter><div style={{ minHeight: '300px', 'border': '1px solid #969696' }}>
            {content}
        </div></HashRouter>
    }
}