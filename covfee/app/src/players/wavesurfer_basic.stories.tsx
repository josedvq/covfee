import React from 'react'
import WaveSurferBasicPlayer from './wavesurfer_basic'

// This default export determines where your story goes in the story list
export default {
    title: 'Players / WaveSurfer Basic',
    component: WaveSurferBasicPlayer,
}

const Template = (args) => <WaveSurferBasicPlayer {...args} />

export const Basic = Template.bind({})
Basic.args = {
    paused: true,
    url: 'https://file-examples-com.github.io/uploads/2017/11/file_example_MP3_700KB.mp3',
}