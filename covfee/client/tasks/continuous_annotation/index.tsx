import Constants from "Constants"
import * as React from "react"
import { TaskExport } from "types/node"
import { AllPropsRequired } from "types/utils"
import { nodeContext } from "../../journey/node_context"
import { fetcher } from "../../utils"
import { CovfeeTaskProps } from "../base"
import { slice } from "./slice"
import type { ContinuousAnnotationTaskSpec } from "./spec"

// TODO: the types of the props are incorrect
interface Props extends CovfeeTaskProps<ContinuousAnnotationTaskSpec> {}

export const ContinuousAnnotationTask: React.FC<Props> = (props) => {
  const args: AllPropsRequired<Props> = {
    ...props,
    spec: {
      userCanAdd: true,
      ...props.spec,
    },
  }

  const { node } = React.useContext(nodeContext)
  const [annotations, setAnnotations] = React.useState()

  const fetchTasks = React.useCallback(async () => {
    const url =
      Constants.base_url +
      node.customApiBase +
      `/tasks/${node.id}/annotations/all`
    const res = await fetcher(url)
    const annotations = await res.json()
    setAnnotations(annotations)
  }, [node.customApiBase, node.id])

  React.useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return (
    <>
      <h3>Node data:</h3>
      <p>{JSON.stringify(node)}</p>

      <p>URL of the task API is {Constants.api_url + node.customApiBase}</p>

      <h3>Annotations in the database:</h3>
      <p>{JSON.stringify(annotations)}</p>
    </>
  )
}

export type { ContinuousAnnotationTaskSpec }

export default {
  taskComponent: ContinuousAnnotationTask,
  taskSlice: slice,
} as TaskExport
