import widgets from "@jupyter-widgets/base";
import React from 'react';
import { render } from 'react-dom';
import Player from './components/player'
import { BackboneStreamer } from './components/streamer'

// Backbone wrapper
const AutolightView = widgets.DOMWidgetView.extend({
    initialize() {
        const backbone = this;

        class Autolight extends React.Component {
            constructor(props) {
                super(props);
                // this.state = {
                //     value: backbone.model.get("value")
                // };
                this.streamer = new BackboneStreamer(backbone);
            }

            onChange(model) {
                this.setState(model.changed);
            }

            componentDidMount() {
                
            }

            render() {
                return <Player streamer={this.streamer}/>;//<div>{this.state.value}</div>;
            }
        }
        const $app = document.createElement("div");
        // const App = e(Hello);
        // ReactDOM.render(App, $app);
        render(<Autolight></Autolight>, $app);
        backbone.el.append($app);
    }
});

export { AutolightView};