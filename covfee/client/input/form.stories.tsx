import React, { useState } from 'react'
import { Form } from './form'

// This default export determines where your story goes in the story list
export default {
    title: 'Input / Form',
    component: Form,

    decorators: [(story, props) => {
        const [values, setValues] = useState([[]])

        return <>
            <div style={{ margin: '0 2em'}}>
                {story({ args: { 
                    ...props.args, 
                    'values': values, 
                    'setValues': setValues }})}
            </div>
            <div style={{ textAlign: 'center' }}>values: {JSON.stringify(values)}</div>
        </>
    }]
}

const Template = (args) => <Form {...args} />

export const Basic = Template.bind({})
Basic.args = {
    "fields": [{
        "prompt": "Does the person in the video laugh?",
        "input": {
            "type": "Radio.Group",
            "options": ["yes", "no"]
        }
    }]
}