import * as React from 'react'
import userContext from './userContext'
import Constants from 'Constants'
import { fetcher, throwBadResponse, getCookieValue, myerror} from './utils'

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

    refreshPromise: Promise<Response>
    timeoutId: number

    constructor(props: Props) {
        super(props)
        const ls = JSON.parse(localStorage.getItem('user'))
        if (ls != null) {
            this.state = {
                username: ls.username,
                loginTime: ls.loginTime,
                logged: true
            }
        }
    }

    scheduleRefresh = (minutes: number = 10) => {
        this.timeoutId = setTimeout(()=>{
            this.refresh()
            this.scheduleRefresh(10)
        }, 1000 * 60 * minutes) // 10 minutes
    }

    componentDidMount() {
        // read user info from localStorage
        const ls = JSON.parse(localStorage.getItem('user'))
        if (ls != null) {
            // user is probably logged in, refresh JWT
            this.refreshPromise = this.refresh()
            this.refreshPromise.then(response=>{
                if (!response.ok) {
                    // user has been logged out
                    this.state = {
                        username: null,
                        loginTime: null,
                        logged: false
                    }
                    localStorage.removeItem('user')
                }
                // user is logged in
                // refresh every 10 mins
                this.scheduleRefresh(10)
            }).catch(()=>{
                // error reaching the server, try again later
                this.scheduleRefresh(1)
            })
        } else {
            // user is not logged in
            this.refreshPromise = Promise.resolve()
        }
    }

    login = (info: LoginInfo) => {
        const url = Constants.auth_url + '/login'
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(info)
        }

        let res = fetcher(url, requestOptions)
            .then(throwBadResponse)

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
        let options = {
            method: 'POST'
        }

        // add the CSRF token
        const cookie = getCookieValue('csrf_refresh_token')
        if (cookie != null) {
            options.headers = {
                'X-CSRF-TOKEN': cookie
            }
        }

        return fetch(url, options)
    }

    public logout = () => {
        const url = Constants.auth_url + '/logout'
        const requestOptions = {
            method: 'POST'
        }

        let p = fetch(url, requestOptions)
            .then(throwBadResponse)
        
        p.then(()=>{
            localStorage.removeItem('user')
            this.setState({
                logged: false,
                username: null,
                loginTime: null
            })
        }).catch(error=>{
            myerror('Error in logging out', error)
        })

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