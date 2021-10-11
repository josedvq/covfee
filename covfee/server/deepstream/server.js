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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Node.js require:
const winston_1 = __importDefault(require("winston"));
const zmq = require("zeromq");
const client_1 = require("@deepstream/client");
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.Console()
    ]
});
class DeepstreamPublisher {
    constructor() {
    }
    run(dsPort, pubPort, subPort) {
        return __awaiter(this, void 0, void 0, function* () {
            const pubSocket = new zmq.Publisher;
            yield pubSocket.bind(`tcp://*:${pubPort}`);
            const subSocket = new zmq.Subscriber;
            yield subSocket.bind(`tcp://*:${subPort}`);
            this.client = new client_1.DeepstreamClient(`127.0.0.1:${dsPort}`);
            yield this.client.login({ username: 'admin', password: 'password' }, (success, data) => {
                if (success) {
                    this.client.record.listen('tasks/.*', (match, response) => {
                        const responseId = parseInt(match.split('/')[1]);
                        response.accept();
                        pubSocket.send(["first-join", responseId]);
                        response.onStop(() => {
                            pubSocket.send(["last-leave", responseId]);
                        });
                    });
                }
            });
            setInterval(function () {
                return __awaiter(this, void 0, void 0, function* () {
                });
            }, 1000);
        });
    }
}
require('yargs')
    .scriptName("store")
    .usage('$0 <cmd> [args]')
    .command('serve [dsPassword] [dsPort] [pubPort] [subPort]', 'Run the server', (yargs) => {
    yargs.positional('dsPassword', {
        type: 'string',
        describe: 'the admin password to deepstream'
    });
    yargs.positional('dsPort', {
        type: 'number',
        default: 6020,
        describe: 'the port to connect to deepstream'
    });
    yargs.positional('pubPort', {
        type: 'number',
        default: 5556,
        describe: 'the port to bind the Publisher to'
    });
    yargs.positional('subPort', {
        type: 'number',
        default: 5557,
        describe: 'the port to bind the Subscriber to'
    });
}, function (argv) {
    const pub = new DeepstreamPublisher();
    pub.run(argv.dsPort, argv.pubPort, argv.subPort);
})
    .help()
    .argv;
