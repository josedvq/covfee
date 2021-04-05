import * as React from 'react'
import { CookiesProvider } from 'react-cookie'
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
import {HITWithRouter} from './hit/hit_loader'

const { Header, Footer, Content, Sider } = Layout;

function About() {
    return <h2>About</h2>;
}

class Root extends React.Component {
    componentDidMount() {
    }

    render() {
        return <Router>
            <CookiesProvider>
                <UserContext>
                    <Layout>
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
            </CookiesProvider>
        </Router>
    }
}

export default Root