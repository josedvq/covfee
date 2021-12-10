import { List, Typography } from 'antd'
const { Title, Text } = Typography
import * as React from 'react'
import { log, myerror } from "../utils"
import buttonManagerContext from './button_manager_context'

type ButtonEventHandler = (arg0: KeyboardEvent) => void
interface ButtonEventSpec {
    [key: string]: {    // event name
        /**
         * keyboard key to be used as event trigger
         */
        defaultKey: string
        /**
         * friendly description of the event
         */
        description: string
        /**
         * event handler
         */
        events: { [key: string]: ButtonEventHandler[]}
    }
}
interface ButtonEventOptions {
    /**
     * If false not allow the user to configure the trigger for this event
     */
    allowCustom: boolean
}
class ButtonEventManagerContext extends React.Component {

    listeners: ButtonEventSpec = {}
    /**
     * maps event keys to event IDs. Used as lookup after a key press event.
     */
    keysToListeners: {[key: string]: string} = {}
    /**
     * tracks the 1/0 status of the key associated to an event.
     */
    listenerStatus: { [key: string]: boolean} = {}

    constructor(props: any) {
        super(props)
        addEventListener("keydown", this.keydown, false)
        addEventListener("keyup", this.keyup, false)
    }

    componentWillUnmount() {
        removeEventListener("keydown", this.keydown)
        removeEventListener("keyup", this.keyup)
    }

    keydown = (e: KeyboardEvent) => {
        // ignore if event occurs in input elements
        const tagName = e.target.tagName.toLowerCase()
        if (['input', 'textarea', 'select', 'button'].includes(tagName)) return

        // return for keys not listened to
        if(!(e.key in this.keysToListeners)) return

        const id = this.keysToListeners[e.key]
        if(!(id in this.listeners)) myerror('Registed key has no event')

        // This is a key I'm listening to and it has a handler
        this.listenerStatus[id] = true
        e.preventDefault()

        if ('keydown' in this.listeners[id].events)
            this.listeners[id].events['keydown'].forEach(fn=>{fn(e)})
    }

    keyup = (e: KeyboardEvent) => {
        // ignore if event occurs in input elements
        const tagName = e.target.tagName.toLowerCase()
        if (['input', 'textarea', 'select', 'button'].includes(tagName)) return

        // return for keys not listened to
        if (!(e.key in this.keysToListeners)) return

        const id = this.keysToListeners[e.key]
        if (!(id in this.listeners)) myerror('Registed key has no event')

        // This is a key I'm listening to
        this.listenerStatus[id] = false

        if ('keyup' in this.listeners[id].events)
            this.listeners[id].events['keyup'].forEach(fn => { fn(e) })
    }

    addListener = (id: string, defaultKey: string, description: string) => {
        this.listeners[id] = {
            defaultKey: defaultKey,
            description: description,
            events: {}
        }
        this.keysToListeners[defaultKey] = id

        // method chaining to add events
        const self = this

        return {
            addEvent: function (eventName: string, callback: ButtonEventHandler) {
                if (!(eventName in self.listeners[id].events))
                    self.listeners[id].events[eventName] = []
                self.listeners[id].events[eventName].push(callback)
                return this
            }
        }
    }

    removeListener = (id: string) => {
        log.info(`removing listener ${id}`)
        if(!(id in this.listeners)) return log.warn(`listener ${id} not found.`)
        const key = this.listeners[id]['defaultKey']
        delete this.keysToListeners[key]
        delete this.listeners[id]
    }

    applyMap = (buttonMap: { [key: string]: string }) => {
        for (const [id, key] of Object.entries(buttonMap)) {
            if (key in this.keysToListeners)
                this.keysToListeners[key] = id
        }
    }

    getStatus = (listener: string) => {
        return this.listenerStatus[listener]
    }


    getContext = () => {
        return {
            addListener: this.addListener,
            removeListener: this.removeListener,
            applyMap: this.applyMap,
            getStatus: this.getStatus,
            renderInfo: this.renderInfo
        }
    }

    getDummyContext = () => {
        return {
            addListener: () => {
                // method chaining to add events
                const self = this
                return {
                    addEvent: function () {
                        return this
                    }
                }
            },
            removeListener: () => {},
            applyMap: () => {},
            getStatus: () => {},
            renderInfo: () => {return null as any}
        }
    }

    renderInfo = () => {
        return <List>
            {Object.entries(this.listeners).map(([key, ev], i) => {
                return <List.Item key={i}>
                    <Text keyboard>
                        <span style={{ color: 'black' }}>
                            [{ev.defaultKey}]
                        </span>
                    </Text>
                    {ev.description}
                </List.Item>
            })}
        </List>
    }

    render() {
        return <buttonManagerContext.Provider value={{
                    getContext: this.getContext,
                    getDummyContext: this.getDummyContext,
                    renderInfo: this.renderInfo}}>
            {this.props.children}
        </buttonManagerContext.Provider>
    }
}

export default ButtonEventManagerContext