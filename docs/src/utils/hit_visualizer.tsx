import * as React from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'

export interface HITVisualizerProps {
    height: number
    hit: HITSpec
}

export interface HITVisualizerState {
}

export class HITVisualizer extends React.Component<HITVisualizerProps, HITVisualizerState> {

    static defaultProps = {
        height: 500
    }

    state: HITVisualizerState = {
    }

    constructor(props: HITVisualizerProps) {
        super(props)
    }

    componentDidMount() {
    }

    render() {
        // add id to each task
        let hitProps = JSON.parse(JSON.stringify(this.props.hit))
        hitProps.tasks = hitProps.tasks.map((task, idx) => {
            task.id = idx
            if(!task.children) {
                task.children = []
            }
            return task
        })
        return <BrowserOnly fallback={<div>The fallback content to display on prerendering</div>}>
            {()=>{
                const HashRouter = require('react-router-dom').HashRouter
                const Hit = require('covfee-client/hit/hit').default

                return <HashRouter>
                    <div style={{position: 'relative', width: '100%', height: this.props.height+'px', border: '1px solid #969696'}}>
                        <Hit
                            {...hitProps}
                            height={this.props.height}
                            routingEnabled={false}
                            url={null}
                            previewMode={true}

                            fetchTaskResponse={()=>Promise.resolve(null)}
                            onSubmit={() => { }} />
                    </div>
                </HashRouter>
            }}
        </BrowserOnly>
    }
}
