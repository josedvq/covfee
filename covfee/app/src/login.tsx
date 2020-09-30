import * as React from 'react';
import { withRouter } from 'react-router'

import {
    Form,
    Input,
    Button,
    Layout,
    Row,
    Col
} from 'antd'
import 'antd/dist/antd.css'
import userContext from './userContext'
const Constants = require('./constants.json')

class Login extends React.Component {
    state: any

    constructor(props: any) {
        super(props);
    }

    componentDidMount() {
    }

    handleFinish = (values: object) => {
        this.context.login(values)
            .then(data => {
                window.location.replace(Constants.admin_url)
            })
            .catch(error => {
                // this.setState({ error: error.toString(), submitting: false })
                console.error('There was an error!', error)
            })
    }

    render() {
        const layout = {
            labelCol: { span: 8 },
            wrapperCol: { span: 16 },
        }
        const tailLayout = {
            wrapperCol: { offset: 8, span: 16 },
        }

        return <Row style={{marginTop: '40px'}}>
            <Col xs={{span: 16, offset: 4}} lg={{span: 8, offset: 8}}>
                <Form
                {...layout}
                name="basic"
                initialValues={{ remember: true }}
                onFinish={this.handleFinish}>
                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[{ required: true, message: 'Please input your username!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password />
                    </Form.Item>

                    <Form.Item {...tailLayout}>
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
                    </Form.Item>
                </Form>
            </Col>
        </Row>
    }
}

Login.contextType = userContext

const LoginWithRouter = withRouter(Login);

export { LoginWithRouter }