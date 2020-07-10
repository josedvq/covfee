/*
This component configures a scene using its props and reads and plays the light stream in it.
*/
import React from 'react';
import BasicScene from '../scenes/basic'
import {Parser} from './parser'

class Player extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = { date: new Date() };

        this.parser = new Parser();
        this.scene = new BasicScene();
        this.scene.build()
        this.container = React.createRef();
        this.streamer = props.streamer;

        // attach callbacks
        this.streamer.on_data(this.on_data.bind(this));
        this.streamer.on_scene_change(this.on_scene_change.bind(this));
        this.streamer.on_scene_change(this.parser.config.bind(this.parser));

        // call to stream first scene
        this.streamer._on_scene_change_callback.bind(this.streamer)();
        this.streamer._on_data_change_callback.bind(this.streamer)();
    }

    componentDidMount() {
        this.container.current.appendChild(this.scene.renderer.domElement);
        // console.log([this.container.current.offsetWidth, this.container.current.offsetHeight])
        this.scene.set_size(480, 320);
        this.scene.render();
    }

    on_scene_change(blocks, dtypes) {
        console.log('scene changed')
        // this.scene.build_responsive(blocks)
    }

    on_data(data) {
        let parsed_data = this.parser.parse(data);
        requestAnimationFrame((function (timestamp) {
            this.scene.update(parsed_data);
            this.scene.render();
        }).bind(this));
    }

    render() {
        return <div ref={this.container} style={this.props.style}></div>;
    }
}

export default Player