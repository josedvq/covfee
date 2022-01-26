const Ajv = require("@josedvq/ajv")
var _ = require('lodash')


class Validator {
    constructor(schemata) {
        this.schemata = schemata
        this.ajv = new Ajv({discriminator: true, verbose: true, logger:false, allErrors: false})
        this.ajv.addSchema(this.schemata)
    }

    // function that will dereference the schema object and return you the compile schema object
    // works only for non-recursive schemas
    _dereference = (obj, id = null) => {
        if(id == null) {
            id = obj.$id
        }
        //lodash function to separate keys and values of object
        _.forOwn(obj, (value, key, obj) => {
            if(_.isObject(value)) {
                if(value.$ref) {
                    let schemaRef //store the $ref value 
                    if(_.startsWith(value.$ref, '#')) {
                        schemaRef = id + value.$ref.substr(1) //for reference in same schema
                    } else {
                        schemaRef = value.$ref // when reference is external
                    }
                    const sch = this.ajv.getSchema(schemaRef)
            
                    obj[key] = this._dereference(sch.schema, id) //set the resolve value to the obj[key]
                    
                } else 
                    this._dereference(value, id)
            }
        })
        return obj //return compiled schema with resolved references.
    }

    get_schema(schemaName) {
        return this.ajv.getSchema(`#/definitions/${schemaName}`).schema
    }

    get_deref_schema(schemaName, preprocessFn) {
        const schema = this.get_schema(schemaName)

        if(preprocessFn) {
            preprocessFn(schema)
        }

        return this._dereference(schema, '#');
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