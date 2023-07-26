import * as React from "react";
import userContext from "./app_context";
import Constants from "Constants";
import {
  log,
  fetcher,
  throwBadResponse,
  getCookieValue,
  myerror,
} from "./utils";

interface LoginInfo {
  username: string;
  password: string;
}


export interface UserState {
  logged: boolean;
  username?: string;
  roles?: string[];
  loginTime?: number;
}

export interface UserContextMethods {
  login: (info: LoginInfo) => Promise<any>;
  loginWithGoogle: (token: string) => Promise<any>;
  logout: () => Promise<void>;
}
export const AppProvider: React.FC = ({ children }) => {

  const [logged, setLogged] = React.useState(false)
  const [username, setUsername] = React.useState(null)
  const [loginTime, setLoginTime] = React.useState(null)
  const [roles, setRoles] = React.useState([])

  // refreshPromise: Promise<Response | void>;
  // timeoutId: any;

  React.useEffect(() => {
    if (localStorage) {
      const ls = JSON.parse(localStorage.getItem("user"));
      if (ls != null) {
        setUsername(ls.username)
        setLoginTime(ls.loginTime)
        setLogged(true)
        setRoles(ls.roles)
      }
    }

    // read user info from localStorage
    const ls = JSON.parse(localStorage.getItem("user"));
    if (ls != null) {
      // user is probably logged in, refresh JWT
      this.refreshPromise = this.refresh();
      this.refreshPromise
        .then((response) => {
          if (!response.ok) {
            // user has been logged out
            this.state = {
              username: null,
              loginTime: null,
              roles: null,
              logged: false,
            };
            localStorage.removeItem("user");
          }
          // user is logged in
          // refresh every 10 mins
          this.scheduleRefresh(10);
        })
        .catch(() => {
          // error reaching the server, try again later
          this.scheduleRefresh(1);
        });
    } else {
      // user is not logged in
      this.refreshPromise = Promise.resolve();
    }
  }, [])


  // Refreshes the auth token
  private refresh = () => {
    log.info("refreshing auth token");
    const url = Constants.auth_url + "/refresh";
    let options: RequestInit = {
      method: "POST",
    };

    // add the CSRF token
    const cookie = getCookieValue("csrf_refresh_token");
    if (cookie != null) {
      options.headers = {
        "X-CSRF-TOKEN": cookie,
      };
    }

    return fetch(url, options);
  };

  scheduleRefresh = (minutes: number = 10) => {
    this.timeoutId = setTimeout(() => {
      this.refresh();
      this.scheduleRefresh(10);
    }, 1000 * 60 * minutes); // 10 minutes
  };

  _onLogin = (data) => {
    const newState = {
      logged: true,
      username: data.username,
      roles: data.roles,
      loginTime: Date.now(),
    };
    this.setState(newState);
    localStorage.setItem("user", JSON.stringify(newState));
  };

  _onFailure = () => {
    this.setState({
      logged: false,
    });
  };

  contextMethods: UserContextMethods = {
    login: (info: LoginInfo) => {
      const url = Constants.auth_url + "/login-password";
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      };

      let res = fetcher(url, requestOptions).then(throwBadResponse);

      res
        .then((data) => {
          this._onLogin(data);
        })
        .catch(() => {
          this._onFailure();
        });

      return res;
    },

    loginWithGoogle: (token: string) => {
      const url = Constants.auth_url + "/login-google";
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token }),
      };

      let res = fetcher(url, requestOptions).then(throwBadResponse);

      res
        .then((data) => {
          log.debug(
            `/auth/login-google responded with ${JSON.stringify(data)}`
          );
          this._onLogin(data);
        })
        .catch(() => {
          this._onFailure();
        });

      return res;
    },

    logout: () => {
      const url = Constants.auth_url + "/logout";
      const requestOptions = {
        method: "POST",
      };

      let p = fetch(url, requestOptions).then(throwBadResponse);

      p.then(() => {
        localStorage.removeItem("user");
        this.setState({
          logged: false,
          username: null,
          roles: null,
          loginTime: null,
        });
      }).catch((error) => {
        myerror("Error in logging out", error);
      });

      return p;
    },
  };

  return (
    <userContext.Provider
      value={{
        ...this.state,
        ...this.contextMethods,
      }}>
      {this.props.children}
    </userContext.Provider>
  );
}
