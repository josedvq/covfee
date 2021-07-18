import * as React from 'react'
import { Provider } from 'react-redux'
import { CookiesProvider } from 'react-cookie'
import { 
    Layout, 
    Typography
} from 'antd'
import './css/gui.scss'

const { Title, Paragraph, Text } = Typography;
import { LoginWithRouter} from './login'
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
        return <Provider store={store}>
            <Router>
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
                </CookiesProvider>
            </Router>
        </Provider>
    }
}

export default Root