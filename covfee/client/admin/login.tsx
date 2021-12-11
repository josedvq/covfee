import * as React from 'react'
import CovfeeLogo from '../art/logo.svg'
import LoginForm from '../login_form'
import { Alert, Col, Row } from 'antd'
import { withRouter } from 'react-router-dom'
import Constants from 'Constants'

interface State {
    error: string
}

class LoginPage extends React.Component<any, State> {

    state: State = {
        error: null
    }

    onLogin = (data) => {
        // only admins and requestors can access the admin panel
        if(!('admin' in data.roles || 'requester' in data.roles)) {
            return this.setState({error: 'A role of "admin" or "requester" is required to access the admin panel. Please contact an administrator to request access.'})
        }
        window.location.replace(Constants.admin_url)
    }

    render() {
        return <Row style={{marginTop: '40px'}}>
            <Col xs={{span: 16, offset: 4}} lg={{span: 8, offset: 8}} xl={{span: 6, offset: 9}}>
                <div className={'covfee-banner'}>
                    <CovfeeLogo width="70" height="70" style={{verticalAlign: 'middle'}}/> covfee
                </div>

                {this.state.error &&
                    <Alert message={this.state.error} type="error" style={{marginBottom: '1em'}} showIcon />}

                <LoginForm onSuccess={this.onLogin}/>
            </Col>
        </Row>
    }
}

const LoginPageWithRouter = withRouter(LoginPage)

export default LoginPageWithRouter