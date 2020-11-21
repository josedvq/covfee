import React, { useState } from 'react'
import {OneDIntensity} from './1d_intensity'
import KeyboardManagerContext from './keyboard_manager'

// This default export determines where your story goes in the story list
export default {
    title: 'Input / Continuous Intensity',
    component: OneDIntensity,

    decorators: [(story, props) => {
        const [intensity, setIntensity] = useState(0)

        return <KeyboardManagerContext>
            <div style={{ width: '100px', height: '400px', margin: '0 auto' }}>
                {story({ args: { ...props.args, 'intensity': intensity, 'setIntensity': setIntensity}})}
            </div>
            <div style={{textAlign: 'center'}}>intensity: {intensity.toPrecision(4)}</div>
        </KeyboardManagerContext>
    }]
}

const Template = (args) => <OneDIntensity {...args} />

export const Basic = Template.bind({})
Basic.args = {
    
}