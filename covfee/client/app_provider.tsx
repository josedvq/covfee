import * as React from "react";
import { appContext } from "./app_context";
import Constants from "Constants";
import { io } from "socket.io-client";
import {
  log,
  fetcher,
  throwBadResponse,
  getCookieValue,
  myerror,
} from "./utils";
import { useChats } from "./models/Chat";
import { AllPropsRequired } from "./types/utils";

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

interface Props {
  admin?: boolean;
  children: React.ReactNode;
}

export const AppProvider: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = {
    admin: false,
    ...props,
  };
  const [logged, setLogged] = React.useState(false);
  const [username, setUsername] = React.useState(null);
  const [loginTime, setLoginTime] = React.useState(null);
  const [roles, setRoles] = React.useState([]);
  const [socket, setSocket] = React.useState(null);
  const [chocket, setChocket] = React.useState(null);
  const chats = useChats(chocket, []);

  React.useEffect(() => {
    if (socket == null) {
      setSocket(io());
    }
    if (chocket == null) {
      if (args.admin) setChocket(io("/admin_chat"));
      else setChocket(io("/chat"));
    }
    if (localStorage) {
      const ls = JSON.parse(localStorage.getItem("user"));
      if (ls != null) {
        setUsername(ls.username);
        setLoginTime(ls.loginTime);
        setLogged(true);
        setRoles(ls.roles);

        refresh()
          .then((response) => {
            if (!response.ok) {
              // user has been logged out
              setUsername(null);
              setLoginTime(null);
              setLogged(false);
              setRoles([]);
              localStorage.removeItem("user");
            }
            // user is logged in
            // refresh every 10 mins
            scheduleRefresh(10);
          })
          .catch(() => {
            // error reaching the server, try again later
            scheduleRefresh(1);
          });
      }
    }

    // read user info from localStorage
    const ls = JSON.parse(localStorage.getItem("user"));
    if (ls != null) {
      // user is probably logged in, refresh JWT
    } else {
      // user is not logged in
    }
  }, [socket]);

  // Refreshes the auth token
  const refresh = async () => {
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

  const scheduleRefresh = (minutes: number = 10) => {
    const timeoutId = setTimeout(() => {
      refresh();
      scheduleRefresh(10);
    }, 1000 * 60 * minutes); // 10 minutes
  };

  const _onLogin = (data) => {
    setUsername(data.username);
    setLoginTime(Date.now());
    setLogged(true);
    setRoles(data.roles);
    localStorage.setItem(
      "user",
      JSON.stringify({
        username,
        loginTime,
        roles,
      })
    );
  };

  const _onFailure = () => {
    setLogged(false);
  };

  const contextMethods: UserContextMethods = {
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
          _onLogin(data);
        })
        .catch(() => {
          _onFailure();
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
          _onLogin(data);
        })
        .catch(() => {
          _onFailure();
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
        setUsername(null);
        setLoginTime(null);
        setLogged(false);
        setRoles([]);
      }).catch((error) => {
        myerror("Error in logging out", error);
      });

      return p;
    },
  };

  return (
    <appContext.Provider
      value={{
        username,
        loginTime,
        logged,
        roles,
        socket,
        chocket,
        ...chats,
        ...contextMethods,
      }}
    >
      {args.children}
    </appContext.Provider>
  );
};
