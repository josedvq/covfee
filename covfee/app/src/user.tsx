import * as React from 'react'
import userContext from './userContext'
const Constants = require('./constants.json')

interface LoginInfo {
    username: string,
    password: string
}

interface Props {}

interface UserState {
    logged: boolean,
    username?: string
    loginTime?: number
}

class UserContext extends React.Component<Props, UserState> {

    state: UserState = {
        logged: false,
        username: null,
        loginTime: null
    }

    refreshPromise: Promise<void>

    constructor(props: Props) {
        super(props)
    }

    componentDidMount() {
        // read user info from localStorage
        const ls = JSON.parse(localStorage.getItem('user'))
        if (ls != null) {
            // request a refresh token
            this.refreshPromise = this.refresh()
            this.refreshPromise.then(() => {
                this.setState({
                    logged: true,
                    username: ls.username,
                    loginTime: ls.loginTime
                })
            }).catch(console.error)
        } else {
            this.refreshPromise = Promise.resolve()
        }
    }

    public login = (info: LoginInfo) => {
        const url = Constants.auth_url + '/login'
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(info)
        }

        let res = fetch(url, requestOptions).then((response) => {
            if (!response.ok) {
                throw Error(response.statusText)
            }
            return response.json()
        })

        res
        .then(data=>{
            const newState = {
                logged: true,
                username: data.username,
                loginTime: Date.now()
            }
            this.setState(newState)
            localStorage.setItem('user', JSON.stringify(newState));
        })
        .catch(()=>{
            this.setState({
                logged: false
            })
        })

        return res
    }

    private refresh = () => {
        const url = Constants.auth_url + '/refresh'
        const requestOptions = {
            method: 'POST'
        }

        return fetch(url, requestOptions).then((response) => {
            if (!response.ok) {
                throw Error(response.statusText)
            }
            return response.json()
        })
    }

    public logout = (info: LoginInfo) => {
        const url = Constants.auth_url + '/logout'
        const requestOptions = {
            method: 'POST'
        }

        let p = fetch(url, requestOptions).then((response) => {
            if (!response.ok) {
                throw Error(response.statusText)
            }
            return response.json()
        })
        
        p.then(()=>{
            localStorage.removeItem('user')
            this.setState({
                logged: false,
                username: null,
                loginTime: null
            })
        }).catch(console.error)

        return p
    }

    render() {
        return <userContext.Provider value={{
            ...this.state, 
            login: this.login,
            logout: this.logout,
            ready: this.refreshPromise
            }}>
            {this.props.children}
        </userContext.Provider>
    }
}

export default UserContext