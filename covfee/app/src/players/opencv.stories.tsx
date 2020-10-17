import React from 'react'
import OpencvFlowPlayer from './opencv'

// This default export determines where your story goes in the story list
export default {
    title: 'Players / OpenCV flow',
    component: OpencvFlowPlayer,
}

const Template = (args) => <OpencvFlowPlayer {...args} />

export const Basic = Template.bind({})
Basic.args = {
    paused: true,
    fps: 30,
    url: 'https://cdn.jsdelivr.net/gh/josedvq/covfee@master/samples/keypoint_annotation/media/sample_mp4_10s.mp4',
    res: [320, 240],
    flow_url: 'https://cdn.jsdelivr.net/gh/josedvq/covfee@master/samples/keypoint_annotation/media/sample_mp4_flow_10s.mp4',
    flow_res: [320, 240]
}