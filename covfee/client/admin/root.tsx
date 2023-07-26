import * as React from "react";
import "antd/dist/reset.css";

import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";

import { AppProvider } from "../app_provider";
import AdminProject from "./project";
import { LoginPage } from "./login";

class Root extends React.Component {
  render() {
    return (
      <Router>
        <AppProvider>
          <Routes>
            <Route
              path="/projects/:projectId"
              element={<AdminProject />}
            ></Route>
            <Route path="/login" element={<LoginPage />}></Route>
            <Route path="/" element={<AdminProject />}></Route>
          </Routes>
        </AppProvider>
      </Router>
    );
  }
}

export default Root;
