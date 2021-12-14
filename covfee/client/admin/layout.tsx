import * as React from 'react'
import CovfeeLogo from '../art/logo.svg'
import { Alert, Col, Layout, Menu, Row, Typography, Result, Button } from 'antd'
import Constants from 'Constants'
import { Footer } from 'antd/lib/layout/layout'
const { Title, Paragraph, Text } = Typography;
import userContext, {UserContextProps} from '../userContext'

import { CovfeeMenuItem } from '../gui'
import UserContext from 'user'

interface HeaderProps {
    menuItems?: React.ReactElement[]
    userContext?: UserContextProps
    showLogin?: boolean
}

class AdminHeader extends React.Component<HeaderProps> {

    static defaultProps: HeaderProps = {
        menuItems: [],
        showLogin: true
    }

    handleLogout = () => {
        this.props.userContext.logout().then(()=>{
            window.location.replace(Constants.admin.login_url)
        })
    }

    handleLogin = () => {
        window.location.replace(Constants.admin.login_url)
    }

    render() {
        return <Menu mode="horizontal" theme="dark" style={{position: 'sticky', top: 0, width: '100%', zIndex: 10000}}>
            <Menu.Item key="1" disabled>
                <CovfeeMenuItem/>
            </Menu.Item>
            {this.props.userContext.logged ?
                <Menu.Item key="2" onClick={this.handleLogout} style={{float:'right'}}>Logout</Menu.Item>:
                this.props.showLogin && <Menu.Item key="2" onClick={this.handleLogin} style={{float:'right'}}>Log in</Menu.Item>}
            {this.props.menuItems && this.props.menuItems.map((item, index) => {
                return <Menu.Item key={3+index}>
                    {item.label}
                </Menu.Item>
            })}
        </Menu>
    }
}



interface LayoutProps {
    loggedRequired?: boolean,
    rolesRequired?: string[],
    header?: HeaderProps,
    
}

class AdminLayout extends React.Component<LayoutProps> {
    context!: React.ContextType<typeof userContext>

    static defaultProps = {
        loggedRequired: true,
        rolesRequired: ['admin', 'requester']
    }

    renderContentForbidden(reason: string) {
        const error_pages = {
            'not_logged': {
                'msg': 'You must be logged in to access this page.',
                'btn': 'Log in',
                'act': () => {
                    window.location.replace(Constants.admin.login_url)
                }
            },
            'roles': {
                'msg': 'A role of "admin" or "requester" is required to access the admin panel. Please contact an administrator to request access',
                'btn': false
            },
            'default': {
                'msg': 'Sorry, you are not authorized to access this page.',
                'btn': false
            }
        }

        const page = (error_pages[reason] || error_pages['default'])

        return <Result
            status="403"
            title="403"
            subTitle={page.msg}
            extra={page.btn && <Button type="primary" onClick={page.act}>{page.btn}</Button>}/>
    }

    render() {
        console.log(Constants)
        return <Layout>
            <AdminHeader {...this.props.header} userContext={this.context}/>
            <Layout>
                {(() => {
                    if(Constants.admin.unsafe_mode_on)
                        return this.props.children

                    if(this.props.loggedRequired && !this.context.logged)
                        return this.renderContentForbidden('not_logged')
            
                    if(this.props.loggedRequired && this.props.rolesRequired) {
                        console.log(this.context)
                        const isAllowed = this.props.rolesRequired.filter(value => this.context.roles.includes(value)).length > 0
                        if(!isAllowed)
                            return this.renderContentForbidden('roles')
                    }

                    return this.props.children
                })()}
            </Layout>
            <Footer>
                <Text style={{ float: 'right', color: '#666666' }}>
                    <CovfeeLogo style={{width: '1em', display: 'inline', position: 'relative', top: '0.3em', marginRight: '4px'}}/>
                    covfee ©{new Date().getFullYear()} Created by Jose Vargas
                    {/* <a href="https://github.com/josedvq/covfee">covfee</a> */}
                </Text>
            </Footer>
        </Layout>
    }
}

AdminLayout.contextType = userContext

export default AdminLayout