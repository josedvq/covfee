import * as React from 'react'
import CovfeeLogo from '../art/logo.svg'
import LoginForm from '../login_form'
import { Col, Row } from 'antd'
import { withRouter } from 'react-router-dom'
import Constants from 'Constants'

class LoginPage extends React.Component {

    onLogin = () => {
        window.location.replace(Constants.admin_url)
    }

    render() {
        return <Row style={{marginTop: '40px'}}>
            <Col xs={{span: 16, offset: 4}} lg={{span: 8, offset: 8}} xl={{span: 6, offset: 9}}>
                <div className={'covfee-banner'}>
                    <CovfeeLogo width="70" height="70" style={{verticalAlign: 'middle'}}/> covfee
                </div>
                <LoginForm onSuccess={this.onLogin}/>
            </Col>
        </Row>
    }
}

const LoginPageWithRouter = withRouter(LoginPage)

export default LoginPageWithRouter