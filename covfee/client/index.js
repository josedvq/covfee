import * as React from "react"
import ReactDOM from "react-dom/client"

import { createHashRouter, RouterProvider } from "react-router-dom"
import { JourneyPage } from "./journey/journey"

const title = "covfee: the continuous video feedback tool"

const router = createHashRouter([
  {
    path: "/journeys/:journeyId/:nodeId?",
    element: <JourneyPage />,
  },
])

const root = ReactDOM.createRoot(document.getElementById("app"))
root.render(<RouterProvider router={router} />)
