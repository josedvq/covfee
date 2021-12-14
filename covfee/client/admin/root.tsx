import * as React from 'react'
import {
    Layout,
    Menu,
    Typography
} from 'antd'
import 'antd/dist/antd.css'

const { Title, Paragraph, Text } = Typography;

import {
    HashRouter as Router,
    Switch,
    Route,
    Link,
} from "react-router-dom"

const { SubMenu } = Menu;
const { Header, Footer, Content, Sider } = Layout;

import UserContext from '../user'
import AdminProject from './project'
import AdminHIT from './hit'
import AdminHeader from './header'
import LoginPage from './login'

class Root extends React.Component {

    render() {
        return <Router>
            <UserContext>
                <Switch>
                    <Route path="/projects/:projectId">
                        <AdminProject />
                    </Route>
                    <Route path="/login">
                        <LoginPage/>
                    </Route>
                    <Route path="/">
                        <AdminProject />
                    </Route>
                </Switch>
                
            </UserContext>
        </Router>
    }
}

export default Root