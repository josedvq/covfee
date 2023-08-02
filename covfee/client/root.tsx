import * as React from "react";
import { Layout, Typography } from "antd";
import "./css/gui.scss";

const { Title, Paragraph, Text } = Typography;
import { AppProvider } from "./app_provider";

import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";

import { JourneyPage } from "./journey/journey";

const { Header, Footer, Content, Sider } = Layout;

const Root = () => {
  return (
    <AppProvider>
      <React.StrictMode>
        <Router>
          <Layout>
            <Layout>
              <Routes>
                <Route
                  path="/journeys/:journeyId/:nodeId?"
                  element={<JourneyPage />}
                ></Route>
              </Routes>
            </Layout>
            {/* <Footer>
                        <Text style={{float: 'right'}}>
                            Interface created with <a href="https://github.com/josedvq/covfee">covfee</a>
                        </Text>
                    </Footer> */}
          </Layout>
        </Router>
      </React.StrictMode>
    </AppProvider>
  );
};

export default Root;
