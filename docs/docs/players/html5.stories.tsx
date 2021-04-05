import React from 'react'
import HTML5Player from './html5'

// This default export determines where your story goes in the story list
export default {
    title: 'Players / HTML5',
    component: HTML5Player,
}

const Template = (args) => <HTML5Player {...args}/>

export const Basic = Template.bind({})
Basic.args = {
    paused: true,
    fps: 30,
    url: 'https://file-examples-com.github.io/uploads/2017/04/file_example_MP4_480_1_5MG.mp4',
    res: [480, 270]
}