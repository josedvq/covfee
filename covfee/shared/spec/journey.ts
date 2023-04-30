
export interface JourneyInterfaceSpec {
    /**
     * Display a bar indicating progress as fraction of completed tasks
     */
    showProgress?: boolean,
    /**
     * Show the button to submit the HIT
     */
    showSubmitButton?: boolean
}

export interface JourneySpec {
    /**
     * path followed by the journey, as a list of node IDs
     */
    nodes: number[]
    /**
     * Interface configuration options
     */
    interface?: JourneyInterfaceSpec
}