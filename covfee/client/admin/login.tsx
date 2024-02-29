import * as React from "react";
import styled from "styled-components";
import { LoginForm } from "../login_form";
import { Alert, Col, Layout, Row, Typography } from "antd";
import Constants from "Constants";
import { log } from "../utils";
import CovfeeLogo from "../art/logo.svg";

export const LoginPage: React.FC<any> = () => {
  const [error, setError] = React.useState<string>();

  const onLogin = (data) => {
    log.debug(`onLogin callback received user data ${JSON.stringify(data)}`);

    // only admins and requestors can access the admin panel
    if (!(data.roles.includes("admin") || data.roles.includes("requester"))) {
      return setError(
        'A role of "admin" or "requester" is required to access the admin panel. Please contact an administrator to request access.'
      );
    }
    window.location.replace(Constants.admin.home_url);
  };

  return (
    <Row style={{ marginTop: "40px" }}>
      <Col
        xs={{ span: 16, offset: 4 }}
        lg={{ span: 8, offset: 8 }}
        xl={{ span: 6, offset: 9 }}
      >
        <CovfeeBanner>
          <CovfeeLogo
            width="70"
            height="70"
            style={{ verticalAlign: "middle" }}
          />{" "}
          covfee
        </CovfeeBanner>

        {error && (
          <Alert
            message={error}
            type="error"
            style={{ marginBottom: "1em" }}
            showIcon
          />
        )}

        <LoginForm onSuccess={onLogin} />
      </Col>
    </Row>
  );
};

const CovfeeBanner = styled.div`
  width: 100%;
  margin: 1em auto 2em;
  text-align: center;
  font-size: 2em;

  > img {
    display: inline-block;
    margin-right: 0.5em;
  }
`;
