import * as React from "react";
import "antd/dist/reset.css";

import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";

import { AppProvider } from "../app_provider";
import ProjectsPage from "./projects_page";
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
              element={<ProjectsPage />}
            ></Route>
            <Route path="/login" element={<LoginPage />}></Route>
            <Route path="/" element={<ProjectsPage />}></Route>
          </Routes>
        </AdminLayout>
      </AppProvider>
    </Router>
  );
};

export default Root;
