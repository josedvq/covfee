const Ajv = require("@josedvq/ajv")

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
        return {valid: valid, errors: valid ? [] : validate_fn.errors.map(e=>{ 
            console.log(e)
        return {
            ...e, 
            'friendlyMessage': this.get_friendly_error_message(e),
            'friendlyPath': this.get_python_datapath(e.instancePath)
        }})}
    }

    get_friendly_error_message = (err) => {
        if(!('keyword' in err)) return err.message

        if(err.keyword == 'additionalProperties') return err.message + `. Property \'${err.params.additionalProperty}\' is unrecognized.`

        if(err.keyword == 'discriminator') {
            if(err.params.error == 'mapping') return `Invalid value \'${err.params.tagValue}\' for property \'${err.params.tag}\'. Please make sure you are using a supported value.`
        }

        return err.message
    }

    get_python_datapath = (path) => {
        const parts = path.substring(1).split('/')
        const keys = parts.map(e => {
            if(!isNaN(e))
                return '['+e+']'
            else
                return `["${e}"]`})
        return keys.join('')
    }
}

module.exports.Validator = Validator