import * as React from "react";
import { Row, Col, Alert } from "antd";
import ReactMarkdown from "react-markdown/with-html";
import { MarkdownContentSpec } from "@covfee-shared/spec/tasks/utils";
import Constants from "Constants";
import { fetcher } from "../../utils";

interface Props {
  content: MarkdownContentSpec;
}

interface State {
  markdown: string;
  error: string;
}

export class MarkdownLoader extends React.Component<Props, State> {
  state: State = {
    markdown: "",
    error: "",
  };

  componentDidMount() {
    if (this.props.content.type == "raw") {
      this.setState({
        markdown: this.props.content.content,
      });
    } else {
      const myHeaders = new Headers();
      // myHeaders.append('pragma', 'no-cache')
      // myHeaders.append('cache-control', 'no-cache')

      var myInit = {
        method: "GET",
        headers: myHeaders,
      };

      fetcher(this.props.content.url, myInit)
        .then((res) => res.text())
        .then((doc) => {
          this.setState({
            markdown: doc.replace(/\$\$www\$\$/g, Constants.www_url),
          });
        })
        .catch((error) => {
          this.setState({
            error: `Error reading file ${this.props.content.url}`,
          });
        });
    }
  }

  renderError() {
    return (
      <>
        <Alert
          message="Instructions task"
          description={`Error fetching file ${this.props.content.url}. Make sure the URL points to a valid file.`}
          type="error"
        />
      </>
    );
  }

  render() {
    if (this.state.error) return this.renderError();

    return (
      <>
        <Row gutter={0}>
          <Col span={24}>
            <ReactMarkdown
              children={this.state.markdown}
              allowDangerousHtml
            ></ReactMarkdown>
          </Col>
        </Row>
      </>
    );
  }
}
