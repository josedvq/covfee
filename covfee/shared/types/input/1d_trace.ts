interface BaseInputSpec {
    /**
     * Range of the continuous values
     * @default [0,1]
     */
    bounds?: [number, number]
}


interface ContinuousValueControls {
    /**
     * Increase intensity
     * @default "s"
     */
     up?: string,
     /**
      * Decrease intensity
      * @default "a"
      */
     down?: string
}


/**
 * @title ranktrace
 */
 export interface RankTraceInputSpec extends BaseInputSpec {
    /**
     * @default "ranktrace"
     */
    mode: "ranktrace",
    controls?: ContinuousValueControls,
    /**
     * Range of the continuous values
     * @default null
     */
    bounds?: [number, number]
}


/**
 * @title ranktrace-new
 */
 export interface RankTraceNewInputSpec extends BaseInputSpec {
    /**
     * @default "ranktrace-new"
     */
    mode: "ranktrace-new",
    controls?: ContinuousValueControls,
    /**
     * Range of the continuous values
     * @default null
     */
    bounds?: [number, number]
}


/**
 * @title gtrace
 */
 export interface GtraceInputSpec extends BaseInputSpec {
    /**
     * @default "gtrace"
     */
    mode: "gtrace",
    controls?: ContinuousValueControls,
    /**
     * Range of the continuous values
     * @default null
     */
    bounds?: [number, number]
}



export type Trace1DInputSpec = RankTraceInputSpec | RankTraceNewInputSpec | GtraceInputSpec