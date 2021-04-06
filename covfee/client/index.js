import 'react-hot-loader/patch';
import * as React from 'react';
import ReactDOM from 'react-dom';

import { AppContainer } from 'react-hot-loader';
import RootContainer from './root';

const title = 'covfee: the continuous video feedback tool';

const render = () => {
    ReactDOM.render(<AppContainer><RootContainer /></AppContainer>, document.getElementById('app'));
}

render(RootContainer)

if (module.hot) {
    module.hot.accept('./root.tsx', () => {
        const NextRootContainer = require('./root.tsx').default;
        render(NextRootContainer);
    })
}