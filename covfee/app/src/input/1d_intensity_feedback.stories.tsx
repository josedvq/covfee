import React, { useState } from 'react'
import {OneDIntensityFeedback} from './1d_intensity_feedback'

// This default export determines where your story goes in the story list
export default {
    title: 'Input / Continuous Intensity',
    component: OneDIntensityFeedback,

    decorators: [(story, props) => {
        const [intensity, setIntensity] = useState(0)

        return <>
            <div style={{ width: '100px', height: '400px', margin: '0 auto' }}>
                {story({ args: { ...props.args, 'intensity': intensity, 'setIntensity': setIntensity}})}
            </div>
            <div style={{textAlign: 'center'}}>intensity: {intensity.toPrecision(4)}</div>
        </>
    }]
}

const Template = (args) => <OneDIntensityFeedback {...args} />

export const Basic = Template.bind({})
Basic.args = {
    keys: [' ', 'ArrowRight', 'ArrowUp']
}