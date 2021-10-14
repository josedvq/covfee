import * as React from 'react'
import {
    Layout,
    Menu,
} from 'antd'
import {
    Link,
} from "react-router-dom"
import userContext from '../userContext'
import Constants from 'Constants'
import CovfeeLogo from '../art/logo.svg'
import '../css/gui.scss'
import { CovfeeMenuItem } from '../gui'

const { Header} = Layout;


class AdminHeader extends React.Component {

    handleLogout = () => {
        this.context.logout().then(()=>{
            window.location.replace(Constants.app_url + '/login')
        })
    }

    render() {
        return <Header className="header" >
            <Menu mode="horizontal" theme="dark" style={{position: 'sticky', top: 0, width: '100%', zIndex: 10000}}>
                <Menu.Item key="1" disabled>
                    <CovfeeMenuItem/>
                </Menu.Item>
                <Menu.Item key="2" onClick={this.handleLogout} style={{float:'right'}}>Logout</Menu.Item>
            </Menu>
        </Header >
    }
}

AdminHeader.contextType = userContext
export default AdminHeader