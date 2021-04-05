import { Spin, Menu } from 'antd'
import * as React from 'react'
import CovfeeLogo from './art/logo.svg'

export class Spinner extends React.Component {
    render() {
        return <div className="spinner">
            <Spin />
        </div>
    }
}

export class CovfeeMenuItem extends React.Component {
    render() {
        return <div style={{'display': 'flex',
                    'alignItems': 'center',
                    'height': '100%'}}>
            <object style={{display: 'block', margin: '0 auto', width: '25px'}} data={CovfeeLogo} type="image/svg+xml"/>
        </div>
    }
}


