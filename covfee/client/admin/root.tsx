import "antd/dist/reset.css"
import * as React from "react"

import { Outlet, Route, HashRouter as Router, Routes } from "react-router-dom"

import { AppProvider } from "../app_provider"
import { ChatProvider } from "../chat_context"
import { AdminProvider } from "./admin_provider"
import { AdminLayout } from "./layout"
import { LoginPage } from "./login"
import { NodeOverlay } from "./node_overlay"
import ProjectsPage from "./projects_page"

const AdminRequired = (props: { loggedRequired: boolean }) => (
  <AdminLayout loggedRequired={props.loggedRequired}>
    <Outlet /> {/* This will render the nested route */}
  </AdminLayout>
)

export const Root: React.FC<void> = (props) => {
  return (
    <Router>
      <AppProvider admin={true}>
        <AdminProvider>
          <ChatProvider>
            <NodeOverlay />
            <Routes>
              <Route element={<AdminRequired loggedRequired={true} />}>
                <Route path="/" element={<ProjectsPage />}></Route>
                <Route
                  path="/projects/:projectId"
                  element={<ProjectsPage />}
                ></Route>
              </Route>
              <Route element={<AdminRequired loggedRequired={false} />}>
                <Route path="/login" element={<LoginPage />}></Route>
              </Route>
            </Routes>
          </ChatProvider>
        </AdminProvider>
      </AppProvider>
    </Router>
  )
}

export default Root
