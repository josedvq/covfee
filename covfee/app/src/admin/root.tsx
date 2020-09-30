import * as React from 'react'
import {
    Layout,
    Menu,
    Breadcrumb,
    Typography
} from 'antd'
import 'antd/dist/antd.css'

const { Title, Paragraph, Text } = Typography;

import {
    HashRouter as Router,
    Switch,
    Route,
    Link,
    useRouteMatch,
    useParams
} from "react-router-dom"

const { SubMenu } = Menu;
const { Header, Footer, Content, Sider } = Layout;

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
                        <Menu.Item key="1" disabled><Link to="/">covfee</Link></Menu.Item>
                    </Menu>
                </Header>
                <Layout>
                    <Switch>
                        
                    </Switch>
                </Layout>
                <Footer>
                    <Text style={{ float: 'right' }}>
                        Experiment developed with <a href="https://github.com/josedvq/covfee">covfee</a>
                    </Text>
                </Footer>
            </Layout>
        </Router>
    }
}

export default Root