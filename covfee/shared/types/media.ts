export interface MediaSpec {
    /**
     * URL to hosted media file
     */
    url: string
}

export interface VideoSpec extends MediaSpec {
    /**
     * Video resolution. Used by some players.
     */
    res: Array<number>,
    /**
     * Video fps. Used by some players to obtain frame number from time (since frame number is not directly accesible in browsers).
     */
    fps: number
}

export interface AudioSpec extends MediaSpec {}
