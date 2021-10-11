// Node.js require:
import { configureStore, Store } from '@reduxjs/toolkit'
import { Knex, knex } from 'knex'
import winston from 'winston'
const zmq = require("zeromq")
import slices from '../../client/tasks/slices'

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console()
    ]
  })

class StoreService {
    rooms: {[key: string] : {
        store: Store,
        actionIndex: number
        numConnections: number
    }} = {}

    // db connection
    db: Knex

    constructor(db_path: string) {
        const config: Knex.Config = {
            client: 'sqlite3',
            connection: {
              filename: db_path,
            }
        }
        this.db = knex(config)
    }

    async _getTaskInfo(responseId) {
        const res = await this.db.select('taskspecs.spec', 'tasks.id')
                         .from('taskspecs')
                         .join('tasks', {'taskspecs.id': 'tasks.taskspec_id'})
                         .join('taskresponses', {'tasks.id': 'taskresponses.task_id'})
                         .where('taskresponses.id', responseId)
                         .first()
        if(!res) return undefined

        const spec = JSON.parse(res.spec)
        return {'taskName': spec.type, 'taskId': res.id}
    }

    /**
     * Returns the redux slice for a task
     * @param responseId 
     */
    async _getSlice(responseId) {
        const taskInfo =  await this._getTaskInfo(responseId)
        if(!taskInfo) return undefined
        const {taskName} = taskInfo
        
        if(!(taskName in slices)) {
            logger.info(`Could not find slice for task name ${taskName}`)
            return undefined
        }
                
        return slices[taskName]
    }

    async _reset(responseId) {
        const slice = await this._getSlice(responseId)
        if(!slice) {
            logger.info(`Could not find slice for responseId ${responseId}`)
            return false
        }
        this.rooms[responseId] = {
            store: configureStore({
                reducer: slice
            }),
            actionIndex: 0,
            numConnections: 0
        }
        return true
    }

    /**
     * Re(sets) the state to the initial state using the redux store
     * @param responseId 
     */
    async reset(responseId) {
        const success = await this._reset(responseId)
        if(success) return this.state(responseId)
        else return {err: `Could not reset responseId ${responseId}`}
    }

    /**
     * Internal method loads the current state from the DB and into the redux store
     * @param responseId
     * @returns true if the state was loaded from the database, false otherwise
     */
    async _load(responseId) {
        const response = await this.db.select('taskresponses.state').from('taskresponses').where('id', responseId).first()
        if(!response || !response.state) return false

        const slice = await this._getSlice(responseId)
        if(!slice) {
            logger.warn(`Could not find slice but found DB state for responseId ${responseId}`)
            return false
        }

        const storedState = JSON.parse(response.state)
        this.rooms[responseId] = {
            store: configureStore({
                reducer: slice,
                preloadedState: storedState
            }),
            actionIndex: 0,
            numConnections: 0
        }
        return true
    }

    /**
     * Internal method saves the redux store to the DB
     * @param responseId
     */
    async _save(responseId) {
        logger.info('_save')
        if(!(responseId in this.rooms)) {
            throw Error(`_save called for non-existent responseId ${responseId}`)
        }
        const state = this.rooms[responseId].store.getState()

        const count = await this.db('taskresponses').where('id', parseInt(responseId)).update({'state': JSON.stringify(state)})

        if(count === 1) return true
        if(count === 0) throw Error(`Could not update state for responseId ${responseId}`)
    }

    async join(responseId) {
        logger.info('join')
        if(!(responseId in this.rooms)) {
            if(!(await this._load(responseId))) {
                const success = await this._reset(responseId)
                if(!success) return {err: `Could not reset responseId ${responseId}`}
            } 
        } 
        
        this.rooms[responseId].numConnections += 1
        
        return this.state(responseId)
    }

    async leave(responseId) {
        if(!(responseId in this.rooms)) {
            return {err: `Could not find responseId ${responseId}`}
        }

        this.rooms[responseId].numConnections -= 1
        const state = await this.state(responseId)
        if(this.rooms[responseId].numConnections <= 0) {
            try {
                await this._save(responseId)
            } catch (error) {
                logger.error(error.message)
            }
            delete this.rooms[responseId]
        } 
        return {
            destroyed: responseId in this.rooms,
            ...state
        }
    }

    async action(responseId, action) {
        if(!(responseId in this.rooms)) return {err: 'Task store not found.'}

        const dispatchedAction = this.rooms[responseId].store.dispatch(action)
        return {
            actionIndex: this.rooms[responseId].actionIndex++,
            action: dispatchedAction
        }
    }

    async state(responseId) {
        if(!(responseId in this.rooms)) return {err: 'Task store not found.'}

        return {
            numConnections: this.rooms[responseId].numConnections,
            actionIndex: this.rooms[responseId].actionIndex,
            state: this.rooms[responseId].store.getState()
        }
    }

    async run(port) {
        const sock = new zmq.Reply
        await sock.bind(`tcp://*:${port}`)
        logger.info(`Running at tcp://localhost:${port}`)
        for await (const [buffer] of sock) {
          const req = JSON.parse(buffer.toString('utf-8'))
          let res

          switch(req['command']) {
            case 'join':
                res = await this.join(req['responseId'])
                break
            case 'leave':
                res = await this.leave(req['responseId'])
                break
            case 'action':
                res = await this.action(req['responseId'], req['action'])
                break
            case 'state':
                res = await this.state(req['responseId'])
                break
            case 'reset':
                res = await this.reset(req['responseId'])
                break
            default:
                res = {err: 'Unrecognized command.'}
          }

          res['success'] = !('err' in res)
          await sock.send(JSON.stringify(res))
        }
    }
}

require('yargs')
  .scriptName("store")
  .usage('$0 <cmd> [args]')
    .command('serve [port]', 'Run the server', (yargs) => {
        yargs.positional('port', {
            type: 'number',
            default: 5556,
            describe: 'the port to bind the server to'
        })
        .option('database', {
            type: 'string',
            description: 'Path to the covfee db.'
        })
    }, function (argv) {
        const store = new StoreService(argv.database)
        store.run(argv.port)
    })
  .help()
  .argv
