"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Node.js require:
const toolkit_1 = require("@reduxjs/toolkit");
const knex_1 = require("knex");
const winston_1 = __importDefault(require("winston"));
const zmq = require("zeromq");
const slices_1 = __importDefault(require("../../client/tasks/slices"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.Console()
    ]
});
class StoreService {
    constructor(db_path) {
        this.rooms = {};
        const config = {
            client: 'sqlite3',
            connection: {
                filename: db_path,
            }
        };
        this.db = knex_1.knex(config);
    }
    _getTaskInfo(responseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.db.select('taskspecs.spec', 'tasks.id')
                .from('taskspecs')
                .join('tasks', { 'taskspecs.id': 'tasks.taskspec_id' })
                .join('taskresponses', { 'tasks.id': 'taskresponses.task_id' })
                .where('taskresponses.id', responseId)
                .first();
            if (!res)
                return undefined;
            const spec = JSON.parse(res.spec);
            return { 'taskName': spec.type, 'taskId': res.id };
        });
    }
    /**
     * Returns the redux slice for a task
     * @param responseId
     */
    _getSlice(responseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const taskInfo = yield this._getTaskInfo(responseId);
            if (!taskInfo)
                return undefined;
            const { taskName } = taskInfo;
            if (!(taskName in slices_1.default)) {
                logger.info(`Could not find slice for task name ${taskName}`);
                return undefined;
            }
            return slices_1.default[taskName];
        });
    }
    _reset(responseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const slice = yield this._getSlice(responseId);
            if (!slice) {
                logger.info(`Could not find slice for responseId ${responseId}`);
                return false;
            }
            this.rooms[responseId] = {
                store: toolkit_1.configureStore({
                    reducer: slice
                }),
                actionIndex: 0,
                numConnections: 0
            };
            return true;
        });
    }
    /**
     * Re(sets) the state to the initial state using the redux store
     * @param responseId
     */
    reset(responseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const success = yield this._reset(responseId);
            if (success)
                return this.state(responseId);
            else
                return { err: `Could not reset responseId ${responseId}` };
        });
    }
    /**
     * Internal method loads the current state from the DB and into the redux store
     * @param responseId
     * @returns true if the state was loaded from the database, false otherwise
     */
    _load(responseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.db.select('taskresponses.state').from('taskresponses').where('id', responseId).first();
            if (!response || !response.state)
                return false;
            const slice = yield this._getSlice(responseId);
            if (!slice) {
                logger.warn(`Could not find slice but found DB state for responseId ${responseId}`);
                return false;
            }
            const storedState = JSON.parse(response.state);
            this.rooms[responseId] = {
                store: toolkit_1.configureStore({
                    reducer: slice,
                    preloadedState: storedState
                }),
                actionIndex: 0,
                numConnections: 0
            };
            return true;
        });
    }
    /**
     * Internal method saves the redux store to the DB
     * @param responseId
     */
    _save(responseId) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('_save');
            if (!(responseId in this.rooms)) {
                throw Error(`_save called for non-existent responseId ${responseId}`);
            }
            const state = this.rooms[responseId].store.getState();
            const count = yield this.db('taskresponses').where('id', parseInt(responseId)).update({ 'state': JSON.stringify(state) });
            if (count === 1)
                return true;
            if (count === 0)
                throw Error(`Could not update state for responseId ${responseId}`);
        });
    }
    join(responseId) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('join');
            if (!(responseId in this.rooms)) {
                if (!(yield this._load(responseId))) {
                    const success = yield this._reset(responseId);
                    if (!success)
                        return { err: `Could not reset responseId ${responseId}` };
                }
            }
            this.rooms[responseId].numConnections += 1;
            return this.state(responseId);
        });
    }
    leave(responseId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(responseId in this.rooms)) {
                return { err: `Could not find responseId ${responseId}` };
            }
            this.rooms[responseId].numConnections -= 1;
            if (this.rooms[responseId].numConnections <= 0) {
                const state = this.state(responseId);
                try {
                    yield this._save(responseId);
                }
                catch (error) {
                    logger.error(error.message);
                }
                delete this.rooms[responseId];
                return { destroyed: true, state: state };
            }
            else {
                return { destroyed: false };
            }
        });
    }
    action(responseId, action) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(responseId in this.rooms))
                return { err: 'Task store not found.' };
            const dispatchedAction = this.rooms[responseId].store.dispatch(action);
            return {
                actionIndex: this.rooms[responseId].actionIndex++,
                action: dispatchedAction
            };
        });
    }
    state(responseId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(responseId in this.rooms))
                return { err: 'Task store not found.' };
            return {
                actionIndex: this.rooms[responseId].actionIndex,
                state: this.rooms[responseId].store.getState()
            };
        });
    }
    run(port) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const sock = new zmq.Reply;
            yield sock.bind(`tcp://*:${port}`);
            logger.info(`Running at tcp://localhost:${port}`);
            try {
                for (var sock_1 = __asyncValues(sock), sock_1_1; sock_1_1 = yield sock_1.next(), !sock_1_1.done;) {
                    const [buffer] = sock_1_1.value;
                    const req = JSON.parse(buffer.toString('utf-8'));
                    let res;
                    switch (req['command']) {
                        case 'join':
                            res = yield this.join(req['responseId']);
                            break;
                        case 'leave':
                            res = yield this.leave(req['responseId']);
                            break;
                        case 'action':
                            res = yield this.action(req['responseId'], req['action']);
                            break;
                        case 'state':
                            res = yield this.state(req['responseId']);
                            break;
                        case 'reset':
                            res = yield this.reset(req['responseId']);
                            break;
                        default:
                            res = { err: 'Unrecognized command.' };
                    }
                    res['success'] = !('err' in res);
                    yield sock.send(JSON.stringify(res));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (sock_1_1 && !sock_1_1.done && (_a = sock_1.return)) yield _a.call(sock_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
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
    });
}, function (argv) {
    const store = new StoreService(argv.database);
    store.run(argv.port);
})
    .help()
    .argv;
