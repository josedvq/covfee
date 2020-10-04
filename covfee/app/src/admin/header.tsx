import * as React from 'react'
import {
    Layout,
    Menu,
} from 'antd'
import {
    Link,
} from "react-router-dom"
import 'antd/dist/antd.css'
import userContext from '../userContext'
const Constants = require('../constants.json')

const { Header} = Layout;


class AdminHeader extends React.Component {

    handleLogout = () => {
        this.context.logout().then(()=>{
            window.location.replace(Constants.app_url + '/login')
        })
    }

    render() {
        return <Header className="header" >
            <div className="logo" />
            <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
                <Menu.Item key="1" disabled><Link to="/">covfee</Link></Menu.Item>
                <Menu.Item key="2" onClick={this.handleLogout} style={{float:'right'}}>Logout</Menu.Item>
            </Menu>
        </Header >
    }
}

AdminHeader.contextType = userContext
export default AdminHeader