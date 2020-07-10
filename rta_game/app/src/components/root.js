import React from 'react';
import { Layout, Menu, Breadcrumb } from 'antd';
import SocketStreamer from './streamer'
import LightPlayer from './player'

const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

class Root extends React.Component {
    constructor(props) {
        super(props);
        this.state = { date: new Date() };
        this.streamer = new SocketStreamer('http://localhost:5000');
        this.player = new AudioPlayer();
        this.streamer.on_audio(this.player.play.bind(this.player));
    }

    componentDidMount() {
        this.streamer.start();
        (async () => {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            let devices = await navigator.mediaDevices.enumerateDevices();
            console.log(devices);
        })();
    }

    render() {
        return <Layout>
                <Header className="header">
                    <div className="logo" />
                    <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
                        <Menu.Item key="1">nav 1</Menu.Item>
                        <Menu.Item key="2">nav 2</Menu.Item>
                        <Menu.Item key="3">nav 3</Menu.Item>
                    </Menu>
                </Header>
                <Layout style={{height: 'calc(100vh - 64px)'}}>
                    <Sider width={200} className="site-layout-background">
                        
                    </Sider>
                    <Layout>
                        <Content>
                        <LightPlayer streamer={this.streamer} style="height: 'calc(100vh - 64px)', width: 'calc(100vw - 200px)'"/>
                            {/* <audio controls preload="none" ref="audio_elem">
                                <source src="audio-stream" type="audio/x-wav;codec=pcm" />
                                    Your browser does not support the audio element.
                            </audio> */}
                        </Content>
                    </Layout>
                </Layout>
            </Layout>
    }
}

export default Root