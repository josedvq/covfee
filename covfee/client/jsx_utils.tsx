import * as React from "react"
import { Result } from "antd"

/**
 * Component that displays an error page's content (without header)
 */

export function ErrorPage() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist. If you were given a link to a study or annotation HIT, please contact the organizers."
    />
  )
}
