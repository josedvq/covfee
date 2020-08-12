// Several interfaces that define players

// These players need to be controllable via keyboard using the toggle_play_pause method, as well as expose their currentTime.
abstract class ContinuousAnnotationPlayer extends React.Component {

    abstract toggle_play_pause(): void

    // return player's current time in seconds
    abstract currentTime(): number
}

export {
    ContinuousAnnotationPlayer
}