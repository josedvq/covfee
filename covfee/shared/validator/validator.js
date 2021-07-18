const Ajv = require("ajv")

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
        return {valid: valid, errors: valid ? [] : validate_fn.errors.map(e=>{ return {
            ...e, 
            'friendlyMessage': this.get_friendly_error_message(e),
            'friendlyPath': this.get_python_datapath(e.dataPath)
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
        return path
    }
}

module.exports.Validator = Validator