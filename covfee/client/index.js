import * as React from "react";
import ReactDOM from "react-dom/client";

import RootContainer from "./root";

const title = "covfee: the continuous video feedback tool";

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(
  <React.StrictMode>
    <RootContainer />
  </React.StrictMode>
);
// const render = () => {
//     ReactDOM.render(<RootContainer />, document.getElementById('app'));
// }

// render(RootContainer)

// if (module.hot) {
//     module.hot.accept('./root.tsx', () => {
//         const NextRootContainer = require('./root.tsx').default;
//         render(NextRootContainer);
//     })
// }
