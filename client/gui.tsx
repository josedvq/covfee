import { Spin } from 'antd'
import * as React from 'react'

class Spinner extends React.Component {
    render() {
        return <div className="spinner">
            <Spin />
        </div>
    }
}

export {
    Spinner
}