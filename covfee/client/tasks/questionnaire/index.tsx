import * as React from "react";
import { Row, Col } from "antd";
import VideojsPlayer from "../../players/videojs";
import WaveSurferPlayer from "../../players/wavesurfer";
import { Form } from "../../input/form";
import { BaseTaskProps } from "../base";
import { QuestionnaireTaskSpec } from "@covfee-shared/spec/tasks/questionnaire";
import { State, slice, actions } from "./slice";
import { TaskExport, TaskType, NodeState } from "types/node";
import { useSelector } from "react-redux";
import { useNodeState } from "journey/state";
import { AllPropsRequired } from "types/utils";

interface Props extends BaseTaskProps {
  spec: QuestionnaireTaskSpec;
}

export const QuestionnaireTask: React.FC<Props> = (props) => {
  // export class QuestionnaireTask extends CovfeeTask<Props, State> {
  const args: AllPropsRequired<Props> = {
    ...props,
    spec: {
      ...props.spec,
      media: null,
      disabledUntilEnd: false,
    },
  };

  const { dispatch } = useNodeState<State>(slice);
  const mediaPaused = useSelector<NodeState<State>, boolean>(
    (state) => state.mediaPaused
  );
  const formValues = useSelector<NodeState<State>, any>(
    (state) => state.formValues
  );
  const formDisabled = useSelector<NodeState<State>, boolean>(
    (state) => state.formDisabled
  );

  // state: State = {
  //     media: {
  //         paused: true
  //     },
  //     form: {
  //         // values: this.props.spec.form && this.props.spec.form.fields.map(field=>{return {name: field.name}}),
  //         values: null,
  //         disabled: this.props.disabled
  //     }
  // }

  React.useEffect(() => {
    if (args.response && args.response.data) {
      dispatch(actions.setFormValues(args.response));
      dispatch(actions.disableForm());
    }

    if (args.spec.disabledUntilEnd != undefined) {
      if (args.spec.disabledUntilEnd) dispatch(actions.disableForm());
      else dispatch(actions.enableForm());
    }
  }, []);

  const handleSubmit = () => {
    args.onSubmit(formValues, null, true);
  };

  return (
    <>
      <Row gutter={16}>
        {args.spec.media && (
          <Col span={16}>
            {(() => {
              switch (args.spec.media.type) {
                case "video":
                  return (
                    <VideojsPlayer
                      {...args.spec.media}
                      onEnded={actions.enableForm}
                    />
                  );
                case "audio":
                  return (
                    <WaveSurferPlayer
                      media={args.spec.media}
                      onEnded={actions.enableForm}
                    />
                  );
                default:
                  return <p>Unrecognized media type.</p>;
              }
            })()}
          </Col>
        )}
        <Col span={args.spec.media ? 8 : 24}>
          <Form
            {...args.spec.form}
            disabled={formDisabled}
            values={formValues}
            setValues={actions.setFormValues}
            withSubmitButton={true}
            renderSubmitButton={args.renderSubmitButton}
            onSubmit={handleSubmit}
          />
        </Col>
      </Row>
    </>
  );
};

export default {
  taskComponent: QuestionnaireTask,
  taskReducer: slice.reducer,
} as TaskExport;
