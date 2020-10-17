import React from 'react'
import VideojsPlayer from './videojs'

// This default export determines where your story goes in the story list
export default {
    title: 'Players / Videojs',
    component: VideojsPlayer,
}

const Template = (args) => <VideojsPlayer {...args} />

export const Basic = Template.bind({})
Basic.args = {
    paused: true,
    fps: 30,
    url: 'https://file-examples-com.github.io/uploads/2017/04/file_example_MP4_480_1_5MG.mp4',
    res: [480, 270]
}