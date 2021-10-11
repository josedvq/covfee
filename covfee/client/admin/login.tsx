import * as React from 'react'
import CovfeeLogo from '../art/logo.svg'
import LoginForm from '../login'
import { Col, Row } from 'antd'
import { withRouter } from 'react-router-dom'

class LoginPage extends React.Component {
    render() {
        return <Row style={{marginTop: '40px'}}>
            <Col xs={{span: 16, offset: 4}} lg={{span: 8, offset: 8}}>
                <div className={'covfee-banner'}>
                    <CovfeeLogo width="70" height="70" /> covfee
                </div>
                <LoginForm/>
            </Col>
        </Row>
    }
}

const LoginPageWithRouter = withRouter(LoginPage)

export default LoginPageWithRouter