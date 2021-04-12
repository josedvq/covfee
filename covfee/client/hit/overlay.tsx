import {Typography} from 'antd'
const { Title, Text } = Typography
import classNames from 'classnames'
import * as React from 'react'

interface Props {
    visible: boolean
    title?: string
    subtext?: string
    mainOptions: React.ReactNode[]
    secondaryOptions?: React.ReactNode[]
}

export class TaskOverlay extends React.Component<Props>{
    
    render() {
        return <div className={classNames('task-overlay', { 'task-overlay-off': !this.props.visible })}>
            <div className="task-overlay-nav">
                {this.props.title && 
                    <Title style={{color: 'white'}}>{this.props.title}</Title>}
                {this.props.subtext && 
                    <Text style={{ color: 'white' }}>this.props.subtext</Text>}
                <div className="task-overlay-primary">
                    {this.props.mainOptions.map((node, index)=>{
                        if (node) return <span key={index} className='main-option'>{node}</span>
                    })}
                </div>
                <div className="task-overlay-secondary">
                    {this.props.secondaryOptions && this.props.secondaryOptions.map((node, index) => {
                        if (node) return <span key={index} className='secondary-option'>{node}</span>
                    })}
                </div>
            </div>
        </div>
    }
}