/**
 * @title continuous-mousemove
 */
export type ContinuousMousemoveInputSpec = {
    /**
     * @default "continuous-mousemove"
     */
    mode: "continuous-mousemove"
}

/**
 * @title continuous-keyboard
 */
export type ContinuousKeyboardInputSpec = {
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
export type GravityKeyboardInputSpec = {
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
     * @default 0.008
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