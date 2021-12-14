import * as React from 'react'
import styled from 'styled-components'
import CovfeeLogo from '../art/logo.svg'
import LoginForm from '../login_form'
import { Alert, Col, Layout, Row, Typography } from 'antd'
import { withRouter } from 'react-router-dom'
import Constants from 'Constants'
import loader from 'ts-loader/dist'
import { log } from '../utils'
import AdminLayout from './layout'
import { Footer } from 'antd/lib/layout/layout'
const { Title, Paragraph, Text } = Typography;

interface State {
    error: string
}

class LoginPage extends React.Component<any, State> {

    state: State = {
        error: null
    }

    onLogin = (data) => {
        log.debug(`onLogin callback received user data ${JSON.stringify(data)}`)
        
        // only admins and requestors can access the admin panel
        if(!(data.roles.includes('admin') || data.roles.includes('requester'))) {
            return this.setState({error: 'A role of "admin" or "requester" is required to access the admin panel. Please contact an administrator to request access.'})
        }
        window.location.replace(Constants.admin.home_url)
    }

    render() {
        return <AdminLayout loggedRequired={false} header={{showLogin: false}}>
            <Row style={{marginTop: '40px'}}>
                <Col xs={{span: 16, offset: 4}} lg={{span: 8, offset: 8}} xl={{span: 6, offset: 9}}>
                    <CovfeeBanner>
                        <CovfeeLogo width="70" height="70" style={{verticalAlign: 'middle'}}/> covfee
                    </CovfeeBanner>

                    {this.state.error &&
                        <Alert message={this.state.error} type="error" style={{marginBottom: '1em'}} showIcon />}

                    <LoginForm onSuccess={this.onLogin}/>
                </Col>
            </Row>
        </AdminLayout>
        
        
    }
}

const CovfeeBanner = styled.div`
    width: 100%;
    margin: 1em auto 2em;
    text-align: center;
    font-size: 2em;
  
    >img {
      display: inline-block;
      margin-right: 0.5em;
    }
`

const LoginPageWithRouter = withRouter(LoginPage)

export default LoginPageWithRouter