import * as React from 'react';
import { withRouter } from 'react-router'

import {
    Form,
    Input,
    Button,
    Layout,
    Row,
    Col, Alert
} from 'antd'
import 'antd/dist/antd.css'
import userContext from './userContext'
import Constants from 'Constants'
import CovfeeLogo from './art/logo.svg'
import './css/gui.css'

class Login extends React.Component {
    state = {
        error: null,
        submitting: false,
    }

    handleFormSubmit = (values: object) => {
        this.setState({ submitting: true })

        this.context.login(values)
            .then(data => {
                window.location.replace(Constants.admin_url)
            })
            .catch(error => {
                this.setState({ error: error.toString(), submitting: false })
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
                <div className={'covfee-banner'}>
                    <img src={CovfeeLogo} width={70}/> covfee
                </div>
                <Form
                {...layout}
                name="basic"
                initialValues={{ remember: true }}
                onFinish={this.handleFormSubmit}>
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

                    {
                    (this.state.error != null) ?
                    <Alert message={this.state.error} type="error" style={{marginBottom: '1em'}} showIcon /> :
                    <></>
                    }
                    
                    <Form.Item {...tailLayout}>
                        <Button type="primary" htmlType="submit">
                            Log in
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