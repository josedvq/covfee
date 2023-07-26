import * as React from "react";
import { Layout, Typography } from "antd";
import "./css/gui.scss";

const { Title, Paragraph, Text } = Typography;
import AppContext from "./app_provider";

import { HashRouter as Router, Switch, Route, Link } from "react-router-dom";

import { JourneyPageWithRouter } from "./journey/journey";

const { Header, Footer, Content, Sider } = Layout;

function About() {
  return <h2>About</h2>;
}

const Root = () => {
  return (
    <Router>
      <AppContext>
        <Layout>
          <Layout>
            <Switch>
              <Route path="/about">
                <About />
              </Route>
              <Route path="/journeys/:journeyId/:nodeId?">
                <JourneyPageWithRouter />
              </Route>
            </Switch>
          </Layout>
          {/* <Footer>
                        <Text style={{float: 'right'}}>
                            Interface created with <a href="https://github.com/josedvq/covfee">covfee</a>
                        </Text>
                    </Footer> */}
        </Layout>
      </AppContext>
    </Router>
  );
};

export default Root;
