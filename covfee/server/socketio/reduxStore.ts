// Node.js require:
import { configureStore, Store } from '@reduxjs/toolkit'
import { Knex, knex } from 'knex'

import slices from '../../client/tasks/slices'

const config: Knex.Config = {
    client: 'sqlite3',
    connection: {
      filename: './data.db',
    }
}
const knexInstance = knex(config)

const zmq = require("zeromq")

class StoreService {
    rooms: {[key: string] : {
        store: Store,
        actionIndex: number
        numConnections: number
    }} = {}

    constructor() {
    }

    join(taskId, taskName) {
        if(!(taskId in this.rooms)) {
            if(!(taskName in slices))
                return {err: `Could not find slice for task name ${taskName}`}
                
            const slice = slices[taskName]
            this.rooms[taskId] = {
                store: configureStore({
                    reducer: {
                        task: slice
                    }
                }),
                actionIndex: 0,
                numConnections: 1
            }
        } else {
            this.rooms[taskId].numConnections += 1
        }
    }

    leave(taskId) {
        if(!(taskId in this.rooms)) {
            return {err: `Could not find taskId ${taskId}`}
        }

        this.rooms[taskId].numConnections -= 1
        if(this.rooms[taskId].numConnections <= 0) {
            const state = this.state(taskId)
            delete this.rooms[taskId]
            return {destroyed: true, state: state}
        } else {
            return {destroyed: false}
        }
    }

    action(taskId, action) {
        if(!(taskId in this.rooms)) return {err: 'Task store not found.'}

        this.rooms[taskId].store.dispatch(action)
        return {actionIndex: this.rooms[taskId].actionIndex}
    }

    state(taskId) {
        if(!(taskId in this.rooms)) return {err: 'Task store not found.'}

        return {
            actionIndex: this.rooms[taskId].actionIndex,
            state: this.rooms[taskId].store.getState()
        }
    }

    async run(port) {
        const sock = new zmq.Reply
        await sock.connect(`tcp://localhost:${port}`)
        for await (const [buffer] of sock) {
          const msg = JSON.parse(buffer.toString('utf-8'))
          const res = this.validate_schema(msg.schema, msg.data)
          await sock.send(JSON.stringify(res))
        }
    }
}

require('yargs')
  .scriptName("filter")
  .usage('$0 <cmd> [args]')
    .command('serve [port]', 'Run the server', (yargs) => {
        yargs.positional('port', {
            type: 'number',
            default: 5556,
            describe: 'the port to bind the server to'
        })
    }, function (argv) {
        const validator = new StoreService()
        validator.run(argv.port)
    })
  .help()
  .argv
