import * as React from 'react'
import { 
    Layout, 
    Menu, 
    Breadcrumb,
    Typography
} from 'antd'
import 'antd/dist/antd.css'

const { Title, Paragraph, Text } = Typography;
import { LoginWithRouter} from './login'
import UserContext from './user'

import {
    HashRouter as Router,
    Switch,
    Route,
    Link,
} from "react-router-dom"
import {HITWithRouter} from './hit'

const { SubMenu } = Menu;
const { Header, Footer, Content, Sider } = Layout;

function About() {
    return <h2>About</h2>;
}

class Root extends React.Component {
    state: any

    componentDidMount() {
    }

    render() {
        return <Router>
            <UserContext>
                <Layout>
                    <Header className="header">
                        <div className="logo" />
                        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
                            <Menu.Item key="1" disabled><Link to="/">covfee</Link></Menu.Item>
                        </Menu>
                    </Header>
                    <Layout>
                        <Switch>
                            <Route path="/about">
                                <About />
                            </Route>
                            <Route path="/login">
                                <LoginWithRouter />
                            </Route>
                            <Route path="/hits/:hitId">
                                <HITWithRouter/>
                            </Route>
                        </Switch>
                    </Layout>
                    <Footer>
                        <Text style={{float: 'right'}}>
                            Experiment developed with <a href="https://github.com/josedvq/covfee">covfee</a>
                        </Text>
                    </Footer>
                </Layout>
            </UserContext>
        </Router>
    }
}

export default Root