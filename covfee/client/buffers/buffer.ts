/**
 * Data sample submitted by the client
 */
export type DataSample = number[]
/**
 * Logged event and auxiliary data from continuous annotation as submitted by the client
 */
export type LogSample = Array<number | string>

/**
 * Holds a data record from continuous annotation as an array of values.
 * Format is [timestamp, sample_counter, [data_sample]]
 * The first must be the (shifted) unix timestamp of the received data sample
 * The second number must be the value of a counter indicating the absolute position of the record
 */
export type DataRecord = [number, number, DataSample]
/**
 * Holds a log record from continuous annotation as an array of values.
 * The first must be the (shifted) unix timestamp of the received log sample
 * The second number must be the value of a counter indicating the absolute position of the record
 */
export type LogRecord = [number, number, LogSample]
/**
 * Holds a data packet to be sent to the server.
 */
export type OutChunk = {
    index: number,
    data: Array<DataRecord>
    log_data: Array<LogRecord>
}

export interface ChunkRange {
    ini_time: number,
    end_time: number,
    data: Array<OutChunk>
}

/**
 * Abstract class for different buffer implementations.
 */
export interface AnnotationBuffer {
    /**
     * True if the buffer has received data or logs since it was instantiated
     */
    receivedData: boolean
    /**
     * Move the head of the buffer to position
     * @param timestamp 
     */
    seek(timestamp: number): void
    /**
     * Pushes a timestamped data sample into the buffer
     * A data sample is meant to be a valid rating provided by the subject in a continuous task 
     * @param timestamp 
     * @param data 
     */
    data(timestamp: number, data: DataSample): void | DataSample
    /**
     * Pushes a timestamped log event into the buffer
     * In contrast with data, log events are auxiliary information about the user experience (eg. user resizes the window)
     * @param timestamp 
     * @param data 
     */
    log(timestamp: number, data: LogSample): void
    /**
     * Rewinds the head until it reaches a sample with timestamp <= to and returns that sample
     * @param to 
     */
    // seek(to: number): DataSample
    /**
     * async function that should return a promise that is resolved until the buffer is cleared (all data submitted to the server) or error out after a provided timeout
     * If the promise is resolved succesfully the buffer can be destructed without risk of data loss.
     * @param timeout - max time, in milliseconds to wait for the buffer to clear.
     */
    flush(timeout?: number): Promise<unknown>
    /**
     * Will populate the buffer with data.
     */
    _load(): Promise<void>
    /**
     * Reads the next data point
     * @param until 
     */
    read(until: number): [number[], LogRecord[]]
}
