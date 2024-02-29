import { Spin, Menu } from "antd"
import * as React from "react"
import CovfeeLogo from "./art/logo.svg"

export class CovfeeMenuItem extends React.Component {
  render() {
    return (
      <div style={{ display: "flex", alignItems: "center", height: "46px" }}>
        <CovfeeLogo width="30" height="30" />
      </div>
    )
  }
}
