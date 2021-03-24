import { List, Typography } from 'antd'
const { Title, Text } = Typography
import * as React from 'react'
import { myerror } from "../utils"
import keyboardManagerContext from './keyboard_manager_context'

interface EventsSpec {
    [key: string]: { 
        key: string
        description: string
        handler: Function
    } 
    
}

class KeyboardManagerContext extends React.Component {

    events: EventsSpec
    keysToIds: {[key: string]: string} = {}

    constructor(props) {
        super(props)
        window.addEventListener("keydown", this.keydown, false)
    }

    componentDidMount() {
        window.addEventListener("keydown", this.keydown, false)
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.keydown)
    }

    keydown = (e: KeyboardEvent) => {
        // ignore if event occurs in input elements
        const tagName = e.target.tagName.toLowerCase()
        if (['input', 'textarea', 'select', 'button'].includes(tagName)) return

        // return for keys not listened to
        if(!(e.key in this.keysToIds)) return

        const id = this.keysToIds[e.key]
        if(!(id in this.events)) myerror('Registed key has no event')

        // This is a key I'm listening to and it has a handler
        e.preventDefault()
        const handler = this.events[id].handler

        // call the event handler
        handler(e)
    }

    addEvents = (events: EventsSpec) => {
        // add the events to current spec
        // events with same name and same keys will be overwritten
        this.events = {
            ...this.events,
            ...events
        }

        Object.keys(events).forEach(id => {
            this.keysToIds[events[id]['key']] = id
        })
    }

    removeEvents = (events: EventsSpec) => {
        // TODO: implement code for removing events
    }

    renderInfo = () => {
        return <List>
            {Object.entries(this.events).map(([key, ev], i) => {
                return <List.Item><Text keyboard><span style={{ color: 'black' }}>[{ev.key}]</span></Text> {ev.description}</List.Item>
            })}
        </List>
    }

    render() {
        return <keyboardManagerContext.Provider value={{
                    addEvents: this.addEvents,
                    removeEvents: this.removeEvents,
                    renderInfo: this.renderInfo}}>
            {this.props.children}
        </keyboardManagerContext.Provider>
    }
}

export default KeyboardManagerContext