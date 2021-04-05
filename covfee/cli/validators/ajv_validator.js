// Node.js require:
const fs = require("fs")
const Ajv = require("ajv")
const schemata = require("../schemata.json")
const zmq = require("zeromq")

class Validator {
    constructor(schemata) {
        this.schemata = schemata
        this.ajv = new Ajv({discriminator: true, verbose: true, logger:false, allErrors: false})
        this.ajv.addSchema(this.schemata)
    }

    validate_schema(schemaName, data) {
        const validate_fn = this.ajv.getSchema(`#/definitions/${schemaName}`)
        if(validate_fn === undefined) {
            throw Error(`Unable to find schema ${schemaName}`)
        }
        const valid = validate_fn(data)
        return {valid: valid, errors: validate_fn.errors}
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
  .command('validate [filepath]', 'validate a given project file', (yargs) => {
        yargs.positional('filepath', {
            type: 'string',
            describe: 'path to the project file'
        })
    }, function (argv) {
        const obj = JSON.parse(fs.readFileSync(argv.filepath, 'utf8'))
        const validator = new Validator(schemata)
        const {valid, errors} = validator.validate_project(obj)
        if (!valid) {
            console.log(JSON.stringify(errors))
        }
    })
    .command('serve [port]', 'Run the validation server', (yargs) => {
        yargs.positional('port', {
            type: 'number',
            default: 5555,
            describe: 'the port to bind the server to'
        })
    }, function (argv) {
        const validator = new Validator(schemata)
        validator.run(argv.port)
    })
  .help()
  .argv
