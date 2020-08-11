import 'react-hot-loader/patch';
import React from 'react';
import ReactDOM from 'react-dom';

import { AppContainer } from 'react-hot-loader';
import RootContainer from './components/root';

const title = 'RTA-GAME annotation tool';

const render = () => {
    ReactDOM.render(<AppContainer><RootContainer /></AppContainer>, document.getElementById('app'));
}

render(RootContainer)

if (module.hot) {
    module.hot.accept('./components/root.tsx', () => {
        const NextRootContainer = require('./components/root.tsx').default;
        render(NextRootContainer);
    })
}