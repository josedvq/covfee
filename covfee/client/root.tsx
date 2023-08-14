import * as React from "react"
import "./css/gui.scss"

import { AppProvider } from "./app_provider"

import { HashRouter as Router, Routes, Route, Link } from "react-router-dom"

import { JourneyPage } from "./journey/journey"

const Root = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/journeys/:journeyId/:nodeId?"
          element={<JourneyPage />}
        ></Route>
      </Routes>
      {/* <Footer>
                        <Text style={{float: 'right'}}>
                            Interface created with <a href="https://github.com/josedvq/covfee">covfee</a>
                        </Text>
                    </Footer> */}
    </Router>
  )
}

export default Root
