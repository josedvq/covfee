import React from 'react';
import { ReconciliationFilled } from "@ant-design/icons"
import {
    Modal,
    Typography,
    Button
} from 'antd';
const { Text, Title, Link } = Typography;

class PingModal extends React.Component {
    public state = {
        visible: false,
    }

    ping() {
        fetch(this.props.url)
            .then(async response => {
                const data = await response.json()

                // check for error response
                if (!response.ok) {
                    // get error message from body or default to response status
                    const error = (data && data.message) || response.status
                    return Promise.reject(error)
                }
            })
            .catch(error => {
                this.on_error()
                console.log('error pinging server!')
            })
    }

    handleRetry() {
        
    }

    render() {
        return <Modal
                title="Server unreachable"
                visible={this.state.visible}
            >
                <Text>
                Something went wrong when sending the task to the server.
                Please try again in a few minutes.
                If the issue persists please email
                    <a href={'mailto:' + this.props.email}> {this.props.email}</a>
                </Text>
                <Button type='primary' onClick={this.handleRetry.bind(this)}></Button>
            </Modal >
    }
}

export {PingModal}