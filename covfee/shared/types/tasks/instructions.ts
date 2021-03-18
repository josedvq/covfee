import { BaseTaskSpec } from '../task'

export interface Spec extends BaseTaskSpec {
    /**
    * A text or Markdown/HTML string containing the experiment instructions.
    */
    html?: string,
    /**
    * A URL to a Markdown (.md) document containing experiment instructions.
    */
    url?: string
}