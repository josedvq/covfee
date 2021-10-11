// Node.js require:
import winston from 'winston'
const zmq = require("zeromq")
import { DeepstreamClient } from '@deepstream/client'

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console()
    ]
})

class DeepstreamPublisher {
    client: DeepstreamClient
    constructor() {
        
    }

    async run(dsPort, pubPort, subPort) { 
        const pubSocket = new zmq.Publisher
        await pubSocket.bind(`tcp://*:${pubPort}`)

        const subSocket = new zmq.Subscriber
        await subSocket.bind(`tcp://*:${subPort}`)

        this.client = new DeepstreamClient(`127.0.0.1:${dsPort}`)
        await this.client.login({username: 'admin', password: 'password'}, (success, data) => {
            if(success) {

                this.client.record.listen('tasks/.*', (match, response) => {
                    const responseId = parseInt(match.split('/')[1])
        
                    response.accept()
                    pubSocket.send(["first-join", responseId])
                  
                    response.onStop(() => {
                        pubSocket.send(["last-leave", responseId])
                    })
                })

            }
        })        

        setInterval(async function(){
        }, 1000)
    }
}

require('yargs')
  .scriptName("store")
  .usage('$0 <cmd> [args]')
    .command('serve [dsPassword] [dsPort] [pubPort] [subPort]', 'Run the server', (yargs) => {

        yargs.positional('dsPassword', {
            type: 'string',
            describe: 'the admin password to deepstream'
        })

        yargs.positional('dsPort', {
            type: 'number',
            default: 6020,
            describe: 'the port to connect to deepstream'
        })

        yargs.positional('pubPort', {
            type: 'number',
            default: 5556,
            describe: 'the port to bind the Publisher to'
        })

        yargs.positional('subPort', {
            type: 'number',
            default: 5557,
            describe: 'the port to bind the Subscriber to'
        })
    }, function (argv) {
        const pub = new DeepstreamPublisher()
        pub.run(argv.dsPort, argv.pubPort, argv.subPort)
    })
  .help()
  .argv
