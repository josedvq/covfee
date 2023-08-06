import * as React from "react";
import "antd/dist/reset.css";

import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";

import { AppProvider } from "../app_provider";
import AdminProject from "./project";
import { LoginPage } from "./login";
import { ChatPopup } from "../chat/chat";
import { AdminLayout } from "./layout";

export const Root: React.FC<void> = (props) => {
  return (
    <Router>
      <AppProvider admin={true}>
        <AdminLayout>
          <Routes>
            <Route
              path="/projects/:projectId"
              element={<AdminProject />}
            ></Route>
            <Route path="/login" element={<LoginPage />}></Route>
            <Route path="/" element={<AdminProject />}></Route>
          </Routes>
        </AdminLayout>
      </AppProvider>
    </Router>
  );
};

export default Root;
