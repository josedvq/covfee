import 'react-hot-loader/patch';
import React from 'react';
import { render } from 'react-dom';

import { AppContainer } from 'react-hot-loader';
import RootContainer from './components/root';
// import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'

const title = 'React with Webpack and Babel';

render(<AppContainer><RootContainer /></AppContainer>, document.getElementById('app'));

if (module.hot) {
    module.hot.accept('./components/root.js', () => {
        const NextRootContainer = require('./components/root.js').default;
        render(<NextRootContainer title={title}/>, document.getElementById('app'));
    })
}