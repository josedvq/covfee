import * as React from "react";
import "antd/dist/antd.css";

import { HashRouter as Router, Switch, Route, Link } from "react-router-dom";

import { AdminProvider } from "./admin_provider";
import AppContext from "../app_provider";
import AdminProject from "./project";
import LoginPage from "./login";

class Root extends React.Component {
  render() {
    return (
      <Router>
        <AdminProvider>
          <AppContext>
            <Switch>
              <Route path="/projects/:projectId">
                <AdminProject />
              </Route>
              <Route path="/login">
                <LoginPage />
              </Route>
              <Route path="/">
                <AdminProject />
              </Route>
            </Switch>
          </AppContext>
        </AdminProvider>
      </Router>
    );
  }
}

export default Root;
