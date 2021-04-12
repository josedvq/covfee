import * as React from 'react'
import classNames from 'classnames'

export const getTaskClass = (type: string) => {
    if (type in AvailableTasks) {
        const taskClass = AvailableTasks[type]
        return taskClass
    } else {
        return null
    }
}

export class CodeBlock extends React.Component {
    render() {
        return <>
            <div>
                <pre className={classNames('docs-code-block')}>
                    {JSON.stringify(this.props.code, null, 2)}
                </pre >
            </div >
        </>
    }
}

export class LivePreviewFrame extends React.Component {
    render() {
        return <>
            <div style={{border: '1px solid #c8c8c8'}}>
                <div style={{ backgroundColor: '#d8d8d8', padding: '3px 5px', textAlign: 'center', color: '#555555'}}>LIVE PREVIEW: data is not being collected</div>
                {this.props.children}
            </div >
        </>
    }
}