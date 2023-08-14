import * as React from "react";

import { Form, Input, Button, Alert, Divider } from "antd";

import { appContext } from "./app_context";
import "./login_form.scss";

interface Props {
  onSuccess: () => void;
  onError?: () => void;
}

export const LoginForm: React.FC<Props> = (props) => {
  const { login } = React.useContext(appContext);
  const [error, setError] = React.useState<string>();
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const handleFormSubmit = (values: any) => {
    setSubmitting(true);

    login(values)
      .then((data) => {
        props.onSuccess(data);
      })
      .catch((error) => {
        setError(error.toString());
        setSubmitting(false);
      });
  };

  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };
  const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
  };

  return (
    <>
      <Divider />
      <Form
        {...layout}
        name="basic"
        initialValues={{ remember: true }}
        onFinish={handleFormSubmit}
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password />
        </Form.Item>

        {error != null && (
          <Alert
            message={error}
            type="error"
            style={{ marginBottom: "1em" }}
            showIcon
          />
        )}

        <Form.Item {...tailLayout}>
          <Button type="primary" htmlType="submit">
            Log in
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};
