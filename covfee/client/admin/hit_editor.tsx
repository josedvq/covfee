import * as React from "react";
const { Option } = Select;
import {
  /*
    Supported input elements
    */
  Modal,
  Input,
  Select,
  Form,
  Button,
  Alert,
} from "antd";

/**
 * Allows the user to edit some fields of a hit specification.
 */
interface Props {
  /**
   * Initial values to populate the form with.
   */
  initialValues: any;
  onUpdate?: (arg0: any) => void;
}

interface State {
  values: any;
}
export class HitEditorForm extends React.Component<Props, State> {
  state: State = {
    values: {},
  };

  formRef = React.createRef();

  constructor(props: Props) {
    super(props);
  }

  componentDidMount() {}

  handleValuesChange = (values: any) => {
    this.setState({ values: { ...this.state.values, ...values } });
  };

  handleFinish = (values: any) => {
    this.props.onUpdate({ config: values });
  };

  render() {
    return (
      <Form
        style={{ margin: "1em" }}
        onValuesChange={(changedValues, allValues) => {
          this.handleValuesChange(changedValues);
        }}
        initialValues={this.props.initialValues.config}
        onFinish={this.handleFinish}
      >
        <Form.Item name="redirectName" label="Redirect name">
          <Input></Input>
        </Form.Item>

        <Form.Item name="redirectUrl" label="Redirect URL">
          <Input></Input>
        </Form.Item>

        <Form.Item name="completionCode" label="Completion Code">
          <Input></Input>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Update
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
