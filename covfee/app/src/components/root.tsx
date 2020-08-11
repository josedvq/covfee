import React from 'react';
import { Layout, Menu, Breadcrumb } from 'antd';
import { TimelineWithRouter} from './timeline';

import {
    HashRouter as Router,
    Switch,
    Route,
    Link,
    useRouteMatch,
    useParams
} from "react-router-dom";

const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

function About() {
    return <h2>About</h2>;
}

class Root extends React.Component {
    state: any

    constructor(props: any) {
        super(props);
    }

    componentDidMount() {
    }

    render() {
        return <Router>
            <Layout>
                <Header className="header">
                    <div className="logo" />
                    <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
                        <Menu.Item key="1"><Link to="/">Annotate</Link></Menu.Item>
                        <Menu.Item key="2"><Link to="/about">About</Link></Menu.Item>
                    </Menu>
                </Header>
                <Layout>
                    <Switch>
                        <Route path="/about">
                            <About />
                        </Route>
                        <Route path="/timelines/:timelineId">
                            <TimelineWithRouter />
                        </Route>
                    </Switch>
                </Layout>
            </Layout>
        </Router>
    }
}

export default Root