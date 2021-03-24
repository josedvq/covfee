export type Intensity1DInputSpec = 
    /**
     * @TJS-title mousemove
     */
    { 
        device: 'mousemove'
    } | {
    device: 'keyboard' | 'gamepad',
    /**
     * Button control mapping
     */
    controls: {
        /**
         * Increase intensity
         */
        up: string,
        /**
         * Decrease intensity
         */
        down: string
    }
}