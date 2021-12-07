const zmq = require("zeromq")

const {Validator} = require('./validator')
const schemata = require("../schemata.json")

class ValidatorService {
    constructor(schemata) {
        this.validator = new Validator(schemata)
    }

    async run(port) {
        const sock = new zmq.Reply
        const addr = `tcp://localhost:${port}`
        await sock.connect(addr)

        console.log(`Waiting on ${addr}`)
        for await (const [buffer] of sock) {
          const msg = JSON.parse(buffer.toString('utf-8'))
          const res = this.validator.validate_schema(msg.schema, msg.data)
          await sock.send(JSON.stringify(res))
        }
    }
}

require('yargs')
  .scriptName("filter")
  .usage('$0 <cmd> [args]')
    .command('serve [port]', 'Run the validation server', (yargs) => {
        yargs.positional('port', {
            type: 'number',
            default: 5555,
            describe: 'the port to bind the server to'
        })
    }, function (argv) {
        const validator = new ValidatorService(schemata)
        validator.run(argv.port)
    })
  .help()
  .argv
