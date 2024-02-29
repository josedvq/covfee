import * as React from "react"
import { Row, Col, Alert } from "antd"
import ReactMarkdown from "react-markdown/with-html"
import { MarkdownContentSpec } from "@covfee-shared/spec/tasks/utils"
import Constants from "Constants"
import { fetcher, urlReplacer } from "../../utils"
import { AllPropsRequired } from "types/utils"

interface Props {
  content: MarkdownContentSpec
}

// export class MarkdownLoader extends React.Component<Props, State> {
export const MarkdownLoader: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = props
  const [markdown, setMarkdown] = React.useState<string>(null)
  const [error, setError] = React.useState<string>(null)

  React.useEffect(() => {
    if (args.content.type == "raw") {
      setMarkdown(args.content.content)
    } else {
      const myHeaders = new Headers()
      const url = urlReplacer(args.content.url)
      myHeaders.append("pragma", "no-cache")
      myHeaders.append("cache-control", "no-cache")

      var myInit = {
        method: "GET",
        headers: myHeaders,
      }

      fetcher(url, myInit)
        .then((res) => {
          if (!res.ok) {
            throw Error()
          }
          return res
        })
        .then((res) => res.text())
        .then((doc) => {
          setMarkdown(doc.replace(/\$\$www\$\$/g, Constants.www_url))
        })
        .catch((error) => {
          setError(
            `Error fetching file ${url}. Make sure the URL points to a valid file.`
          )
        })
    }
  }, [args.content.type, args.content])

  if (error !== null) {
    return (
      <>
        <Alert message="Instructions task" description={error} type="error" />
      </>
    )
  }

  return (
    <>
      <Row gutter={0}>
        <Col span={24}>
          <ReactMarkdown allowDangerousHtml>{markdown}</ReactMarkdown>
        </Col>
      </Row>
    </>
  )
}
