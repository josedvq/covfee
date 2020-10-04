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

class Root extends React.Component {
    state: any

    constructor(props: any) {
        super(props);
    }

    componentDidMount() {
    }

    render() {
        return <Router>
            <UserContext>
                <Layout>
                    <AdminHeader/>
                    <Layout>
                        <Switch>
                            <Route path="/">
                                <AdminProject />
                            </Route>
                            <Route path="/projects/:projectId">
                                <AdminProject />
                            </Route>
                            <Route path="/timelines/:timelineId">
                                <AdminHIT />
                            </Route>
                        </Switch>
                    </Layout>
                    <Footer>
                        <Text style={{ float: 'right' }}>
                            <a href="https://github.com/josedvq/covfee">covfee</a>
                        </Text>
                    </Footer>
                </Layout>
            </UserContext>
        </Router>
    }
}

export default Root