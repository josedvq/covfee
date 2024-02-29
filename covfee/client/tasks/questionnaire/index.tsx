import { Col, Row } from "antd"
import * as React from "react"
import { useSelector } from "react-redux"
import { NodeState, TaskExport } from "types/node"
import { AllPropsRequired } from "types/utils"
import { Form } from "../../input/form"
import { useDispatch } from "../../journey/state"
import VideojsPlayer from "../../players/videojs"
import WaveSurferPlayer from "../../players/wavesurfer"
import { CovfeeTaskProps } from "../base"
import { State, actions, slice } from "./slice"
import type { QuestionnaireTaskSpec } from "./spec"

interface Props extends CovfeeTaskProps<QuestionnaireTaskSpec> {}

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

export type { QuestionnaireTaskSpec }

export default {
  taskComponent: QuestionnaireTask,
  taskSlice: slice,
} as TaskExport
