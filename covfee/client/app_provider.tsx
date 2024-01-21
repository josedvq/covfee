import * as React from "react"
import { appContext } from "./app_context"
import Constants from "Constants"
import { io } from "socket.io-client"
import {
  log,
  fetcher,
  throwBadResponse,
  getCookieValue,
  myerror,
} from "./utils"
import { useChats } from "./models/Chat"
import { AllPropsRequired } from "./types/utils"
import { useParams } from "react-router-dom"
import { useUserConfig } from "./user_config"

interface LoginInfo {
  username: string
  password: string
}

export interface UserState {
  logged: boolean
  username?: string
  roles?: string[]
  loginTime?: number
}

export interface UserContextMethods {
  login: (info: LoginInfo) => Promise<any>
  logout: () => Promise<void>
}

interface Props {
  admin?: boolean
  children: React.ReactNode
}

export const AppProvider: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = {
    admin: false,
    ...props,
  }

  const getSocket = () => {
    if (args.admin) {
      console.log("IO: connect: /admin")
      return io("/admin")
    } else {
      if (routeParams.journeyId) {
        console.log("IO: connect", {
          auth: { journeyId: routeParams.journeyId },
        })
        return io({ auth: { journeyId: routeParams.journeyId } })
      } else {
        console.log("IO: connect", {})
        return io()
      }
    }
  }

  const getChocket = () => {
    if (args.admin) {
      console.log("IO: connect: /admin_chat")
      return io("/admin_chat")
    } else {
      console.log("IO: connect: /chat")
      return io("/chat")
    }
  }

  const routeParams = useParams()
  const [logged, setLogged] = React.useState(false)
  const [username, setUsername] = React.useState(null)
  const [loginTime, setLoginTime] = React.useState(null)
  const [roles, setRoles] = React.useState([])
  const [socket, setSocket] = React.useState(getSocket)
  const [chocket, setChocket] = React.useState(getChocket)
  const userConfig = useUserConfig(props.admin ? "admin" : "user")

  // Refreshes the auth token
  const refresh = async () => {
    log.info("refreshing auth token")
    const url = Constants.auth_url + "/refresh"
    let options: RequestInit = {
      method: "POST",
    }

    // add the CSRF token
    const cookie = getCookieValue("csrf_refresh_token")
    if (cookie != null) {
      options.headers = {
        "X-CSRF-TOKEN": cookie,
      }
    }

    return fetch(url, options)
  }

  const scheduleRefresh = React.useCallback((minutes: number = 10) => {
    setTimeout(() => {
      refresh()
      scheduleRefresh(10)
    }, 1000 * 60 * minutes) // 10 minutes
  }, [])

  React.useEffect(() => {
    if (localStorage) {
      const ls = JSON.parse(localStorage.getItem("user"))
      if (ls != null) {
        setUsername(ls.username)
        setLoginTime(ls.loginTime)
        setLogged(true)
        setRoles(ls.roles)

        refresh()
          .then((response) => {
            if (!response.ok) {
              // user has been logged out
              setUsername(null)
              setLoginTime(null)
              setLogged(false)
              setRoles([])
              localStorage.removeItem("user")
            }
            // user is logged in
            // refresh every 10 mins
            scheduleRefresh(10)
          })
          .catch(() => {
            // error reaching the server, try again later
            scheduleRefresh(1)
          })
      }
    }
  }, [scheduleRefresh])

  const _onLogin = (data) => {
    setUsername(data.username)
    setLoginTime(Date.now())
    setLogged(true)
    setRoles(data.roles)
    localStorage.setItem(
      "user",
      JSON.stringify({
        username,
        loginTime,
        roles,
      })
    )
  }

  const _onFailure = () => {
    setLogged(false)
  }

  const contextMethods: UserContextMethods = {
    login: (info: LoginInfo) => {
      const url = Constants.auth_url + "/login-password"
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      }

      let res = fetcher(url, requestOptions).then(throwBadResponse)

      res
        .then((data) => {
          _onLogin(data)
        })
        .catch(() => {
          _onFailure()
        })

      return res
    },

    logout: () => {
      const url = Constants.auth_url + "/logout"
      const requestOptions = {
        method: "POST",
      }

      let p = fetch(url, requestOptions).then(throwBadResponse)

      p.then(() => {
        localStorage.removeItem("user")
        setUsername(null)
        setLoginTime(null)
        setLogged(false)
        setRoles([])
      }).catch((error) => {
        myerror("Error in logging out", error)
      })

      return p
    },
  }

  return (
    <appContext.Provider
      value={{
        username,
        loginTime,
        logged,
        roles,
        socket,
        setSocket,
        chocket,
        setChocket,
        userConfig,
        ...contextMethods,
      }}
    >
      {args.children}
    </appContext.Provider>
  )
}
