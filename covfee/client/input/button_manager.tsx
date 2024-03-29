import { List, Typography } from 'antd'
const { Title, Text } = Typography
import * as React from 'react'
import { log, myerror } from "../utils"
import buttonManagerContext from './button_manager_context'

type ButtonEventHandler = (arg0: KeyboardEvent) => void
interface ButtonEventSpec {
    [key: string]: {    // event name
        /**
         * default key to be used as event trigger
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

export interface ButtonManagerClient {
    addListener: (id: string, description: string) => any,
    removeListener: (id: string) => void,
    applyMap: (defaultMap: { [key: string]: string }, userMap: { [key: string]: string }) => void,
    getStatus: (listener: string) => boolean,
    renderInfo: () => React.ReactElement
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
    }

    componentDidMount(): void {
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

    addListener = (id: string, description: string) => {
        this.listeners[id] = {
            defaultKey: null,
            description: description,
            events: {}
        }

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
        if(key in this.keysToListeners)
            delete this.keysToListeners[key]
        delete this.listeners[id]
    }

    applyMap = (defaultMap: { [key: string]: string }, userMap: { [key: string]: string } = {}) => {
        for (let [id, key] of Object.entries(defaultMap)) {
            if(id in userMap)
                key = userMap[id]
            if(id in this.listeners) {
                this.listeners[id].defaultKey = key
                this.keysToListeners[key] = id
            }
        }
    }

    getStatus = (listener: string) => {
        return this.listenerStatus[listener]
    }


    getClient = () => {
        return {
            addListener: this.addListener,
            removeListener: this.removeListener,
            applyMap: this.applyMap,
            getStatus: this.getStatus,
            renderInfo: this.renderInfo
        } as ButtonManagerClient
    }

    getDummyClient = () => {
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
            getStatus: () => false,
            renderInfo: () => {return null as any}
        } as ButtonManagerClient
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
                    getContext: this.getClient,
                    getDummyContext: this.getDummyClient,
                    renderInfo: this.renderInfo}}>
            {this.props.children}
        </buttonManagerContext.Provider>
    }
}

export default ButtonEventManagerContext