import * as React from 'react';

import {
    Form,
    Input,
    Button,
    Layout,
    Row,
    Col, Alert, Divider
} from 'antd'
import {GoogleLoginButton} from 'react-social-login-buttons'

import userContext from './userContext'
import Constants from 'Constants'
import CovfeeLogo from './art/logo.svg'
import { GoogleLogin } from 'react-google-login'
import './login_form.scss'

import { log } from './utils'


interface Props {
    onSuccess: () => void
    onError?: () => void
}

export default class LoginForm extends React.Component<Props> {
    state = {
        error: null,
        submitting: false,
    }

    handleFormSubmit = (values: any) => {
        this.setState({ submitting: true })

        this.context.login(values)
            .then(data => {
                this.props.onSuccess(data)
            })
            .catch(error => {
                this.setState({ error: error.toString(), submitting: false })
            })
    }

    onSuccessGoogle = (response: any) => {
        log.debug(response)
        log.debug(Constants.google_client_id)
        this.context.loginWithGoogle(response.tokenId)
            .then(data => {
                this.props.onSuccess(data)
            })
            .catch(error => {
                this.setState({ error: error.toString(), submitting: false })
            })
    }

    onFailureGoogle = () => {

    }

    render() {
        const layout = {
            labelCol: { span: 8 },
            wrapperCol: { span: 16 },
        }
        const tailLayout = {
            wrapperCol: { offset: 8, span: 16 },
        }

        return <>

            <GoogleLogin
                clientId={Constants.google_client_id}
                responseType='id_token'
                buttonText="Sign in with Google"
                onSuccess={this.onSuccessGoogle}
                onFailure={this.onFailureGoogle}
                cookiePolicy={'single_host_origin'}
                theme='light'
                className='login-google-btn'/>

            <Divider />
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

                    {this.state.error != null &&
                        <Alert message={this.state.error} type="error" style={{marginBottom: '1em'}} showIcon />}
                    
                    <Form.Item {...tailLayout}>
                        <Button type="primary" htmlType="submit">
                            Log in
                        </Button>
                    </Form.Item>
            </Form>
        </>
    }
}

LoginForm.contextType = userContext
