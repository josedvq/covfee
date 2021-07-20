import {Typography} from 'antd'
import styled from 'styled-components'
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
        if(!this.props.visible) return null

        return <TaskOverlayDiv>
            <nav>
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
            </nav>
        </TaskOverlayDiv>
    }
}

const TaskOverlayDiv = styled.div`
    position: absolute;
    padding: 1em 0;
    width: 50%;
    top: calc(35vh);
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, .7);
    border-width: 3px;
    border-style: solid;
    border-color: #363636;
    z-index: 2;
  
    span.main-option {
      display: inline-block;
      margin: 0 5px;
    }
  
    > nav {
      width: 100%;
      text-align: center;
    }
  }
  `