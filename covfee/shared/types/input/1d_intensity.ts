interface BaseInputSpec {
    /**
     * Range of the continuous values
     * @default [0,1]
     */
    bounds?: [number, number]
}

/**
 * @title binary
 */
 export interface BinaryInputSpec {
    /**
     * @default "binary"
     */
    mode: "binary",
    /**
     * Button controls
     */
    controls?: {
        /**
         * Activate 
         * @default "a"
         */
        up?: string
    }
}

/**
 * @title continuous-mousemove
 */
export interface ContinuousMousemoveInputSpec extends BaseInputSpec {
    /**
     * @default "continuous-mousemove"
     */
    mode: "continuous-mousemove"
}

/**
 * @title gravity-keyboard
 */
 export interface GravityKeyboardInputSpec extends BaseInputSpec {
    /**
     * @default "gravity-keyboard"
     */
    mode: "gravity-keyboard",
    /**
     * Initial speed when a key is pressed
     * @default 0.1
     */
    jump_speed?: number,
    /**
     * Acceleration constant.
     * @default 0.0025
     */
    acceleration_constant?: number
    controls?: {
        /**
         * Increase intensity
         * @default "a"
         */
        up?: string
    }
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
 * @title continuous-keyboard
 */
export interface ContinuousKeyboardInputSpec extends BaseInputSpec{
    /**
     * @default "continuous-keyboard"
     */
    mode: "continuous-keyboard",
    controls?: ContinuousValueControls
}


export type Intensity1DInputSpec = BinaryInputSpec | 
                                   ContinuousMousemoveInputSpec | 
                                   ContinuousKeyboardInputSpec | 
                                   GravityKeyboardInputSpec