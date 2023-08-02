import * as React from "react";
import { Row, Col } from "antd";
import { InstructionsTaskSpec } from "@covfee-shared/spec/tasks/instructions";
import { MarkdownLoader } from "../utils/markdown_loader";
import { BaseTaskProps } from "../base";
import { Form } from "../../input/form";
import { AllPropsRequired } from "types/utils";
import { State, slice, actions } from "./slice";
import { useNodeState } from "../../journey/state";
import { NodeState, TaskExport } from "types/node";
import { useSelector } from "react-redux";

interface Props extends BaseTaskProps {
  spec: InstructionsTaskSpec;
}
export const InstructionsTask: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = {
    ...props,
  };

  const { dispatch } = useNodeState<State>(slice);

  const formValues = useSelector<NodeState<State>, any>(
    (state) => state.formValues
  );
  const formDisabled = useSelector<NodeState<State>, boolean>(
    (state) => state.formDisabled
  );

  React.useEffect(() => {
    if (args.response && args.response.data) {
      dispatch(actions.setFormValues(args.response));
      dispatch(actions.disableForm());
    }
  }, []);

  const handleSubmit = (values: any) => {
    // let vals = this.state.form.values
    // if(!vals || !vals.length) vals = null

    args.onSubmit(formValues, null, true);
  };

  return (
    <Row style={{ margin: "2em 0" }}>
      <Col
        sm={{ span: 22, offset: 1 }}
        md={{ span: 20, offset: 2 }}
        lg={{ span: 16, offset: 4 }}
        xl={{ span: 14, offset: 5 }}
      >
        <MarkdownLoader content={args.spec.content} />
        <Form
          {...args.spec.form}
          disabled={args.disabled}
          values={formValues}
          setValues={(v) => dispatch(actions.setFormValues(v))}
          withSubmitButton={true}
          renderSubmitButton={args.renderSubmitButton}
          onSubmit={handleSubmit}
        />
      </Col>
    </Row>
  );
};

export default {
  taskComponent: InstructionsTask,
  taskReducer: slice.reducer,
} as TaskExport;
