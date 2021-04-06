/**
 * @title continuous-mousemove
 */
export interface ContinuousMousemoveInputSpec {
    /**
     * @default "continuous-mousemove"
     */
    mode: "continuous-mousemove"
}

/**
 * @title continuous-keyboard
 */
export interface ContinuousKeyboardInputSpec {
    /**
     * @default "continuous-keyboard"
     */
    mode: "continuous-keyboard",
    controls: {
        /**
         * Increase intensity
         * @default "s"
         */
        up: string,
        /**
         * Decrease intensity
         * @default "a"
         */
        down: string
    }
}

/**
 * @title gravity-keyboard
 */
export interface GravityKeyboardInputSpec {
    /**
     * @default "gravity-keyboard"
     */
    mode: "gravity-keyboard",
    /**
     * Initial speed when a key is pressed
     * @default 0.1
     */
    jump_speed: number,
    /**
     * Acceleration constant.
     * @default 0.0025
     */
    acceleration_constant: number
    controls: {
        /**
         * Increase intensity
         * @default "a"
         */
        up: string
    }
}

export type Intensity1DInputSpec = ContinuousMousemoveInputSpec | ContinuousKeyboardInputSpec | GravityKeyboardInputSpec