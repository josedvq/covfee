import * as React from "react"
import { Row, Col } from "antd"
import VideojsPlayer from "../../players/videojs"
import WaveSurferPlayer from "../../players/wavesurfer"
import { Form } from "../../input/form"
import { BaseTaskProps } from "../base"
import { QuestionnaireTaskSpec } from "@covfee-shared/spec/tasks/questionnaire"
import { State, slice, actions } from "./slice"
import { TaskExport, TaskType, NodeState } from "types/node"
import { useSelector } from "react-redux"
import { useDispatch } from "../../journey/state"
import { AllPropsRequired } from "types/utils"

interface Props extends BaseTaskProps {
  spec: QuestionnaireTaskSpec
}

export const QuestionnaireTask: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = {
    ...props,
    spec: {
      ...props.spec,
      media: null,
      disabledUntilEnd: false,
    },
  }

  const dispatch = useDispatch()
  const mediaPaused = useSelector<NodeState<State>, boolean>(
    (state) => state.mediaPaused
  )
  const formValues = useSelector<NodeState<State>, any>(
    (state) => state.formValues
  )
  const formDisabled = useSelector<NodeState<State>, boolean>(
    (state) => state.formDisabled
  )

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
                )
              case "audio":
                return (
                  <WaveSurferPlayer
                    media={args.spec.media}
                    onEnded={actions.enableForm}
                  />
                )
              default:
                return <p>Unrecognized media type.</p>
              }
            })()}
          </Col>
        )}
        <Col span={args.spec.media ? 8 : 24}>
          <Form
            {...args.spec.form}
            disabled={formDisabled}
            values={formValues}
            setValues={(v) => dispatch(actions.setFormValues(v))}
            withSubmitButton={true}
            renderSubmitButton={args.renderSubmitButton}
          />
        </Col>
      </Row>
    </>
  )
}

export default {
  taskComponent: QuestionnaireTask,
  taskSlice: slice,
} as TaskExport
