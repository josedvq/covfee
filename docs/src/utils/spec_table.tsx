import schemata from "@schemata"
import { JSONSchema7 } from "json-schema"
import * as React from "react"

const SchemaProperty: React.FC<
  React.PropsWithChildren<{ schema: JSONSchema7 }>
> = ({ schema }) => {
  return (
    <div
      style={{
        marginLeft: "20px",
        borderLeft: "2px solid #ccc",
        paddingLeft: "20px",
      }}
    >
      <h4>{schema.title}</h4>
      <p>Type: {schema.type}</p>
      {schema.default !== undefined && <p>Default: {schema.default}</p>}
      {schema.description && <p>Description: {schema.description}</p>}
      {schema.properties && <Schema schema={schema} />}
    </div>
  )
}

// Recursive component to handle nested properties
const Schema: React.FC<React.PropsWithChildren<{ schema: JSONSchema7 }>> = ({
  schema,
}) => {
  const properties = schema.properties || {}
  return (
    <div>
      {Object.entries(properties).map(([key, value]) => (
        <SchemaProperty key={key} schema={value as JSONSchema7} />
      ))}
    </div>
  )
}

export const SchemaTable: React.FC<{ name: string }> = ({ name }) => {
  const schema = React.useMemo(() => {
    console.log(schemata["definitions"])
    console.log(name)
    console.log(schemata["definitions"][name])
    if (!(name in schemata["definitions"])) {
      return null
    }
    return schemata["definitions"][name]
  }, [name])

  React.useEffect(() => {
    console.log(schema)
  })
  return <Schema schema={schema} />
}
