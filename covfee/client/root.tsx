import * as React from 'react'
import { 
    Layout, 
    Typography
} from 'antd'
import './css/gui.scss'

const { Title, Paragraph, Text } = Typography;
import UserContext from './user'

import {
    HashRouter as Router,
    Switch,
    Route,
    Link,
} from "react-router-dom"

import store from './store'
import { HitLoaderWithRouter} from './hit/hit_loader'

const { Header, Footer, Content, Sider } = Layout;

function About() {
    return <h2>About</h2>;
}

class Root extends React.Component {
    componentDidMount() {
    }

    render() {
        return <Router>
                <UserContext>
                    <Layout>
                        <Layout>
                            <Switch>
                                <Route path="/about">
                                    <About />
                                </Route>
                                <Route path="/hits/:hitId">
                                    <HitLoaderWithRouter/>
                                </Route>
                            </Switch>
                        </Layout>
                        {/* <Footer>
                            <Text style={{float: 'right'}}>
                                Interface created with <a href="https://github.com/josedvq/covfee">covfee</a>
                            </Text>
                        </Footer> */}
                    </Layout>
                </UserContext>
        </Router>
    }
}

export default Root