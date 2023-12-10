import * as React from "react"
import "antd/dist/reset.css"

import { HashRouter as Router, Routes, Route, Link } from "react-router-dom"

import { AppProvider } from "../app_provider"
import { ChatProvider } from "../chat_context"
import ProjectsPage from "./projects_page"
import { LoginPage } from "./login"
import { AdminLayout } from "./layout"
import { useChats } from "../models/Chat"
import { AdminProvider } from "./admin_provider"
import { NodeOverlay } from "./node_overlay"

export const Root: React.FC<void> = (props) => {
  return (
    <Router>
      <AppProvider admin={true}>
        <AdminProvider>
          <ChatProvider>
            <AdminLayout>
              <NodeOverlay />
              <Routes>
                <Route
                  path="/projects/:projectId"
                  element={<ProjectsPage />}
                ></Route>
                <Route path="/login" element={<LoginPage />}></Route>
                <Route path="/" element={<ProjectsPage />}></Route>
              </Routes>
            </AdminLayout>
          </ChatProvider>
        </AdminProvider>
      </AppProvider>
    </Router>
  )
}

export default Root
