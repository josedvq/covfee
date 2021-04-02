/**
 * Data sample submitted by the client
 */
export type DataSample = Array<number | string>
/**
 * Logged event and auxiliary data from continuous annotation as submitted by the client
 */
export type LogSample = Array<number | string>

/**
 * Holds a data record from continuous annotation as an array of values.
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
    data: Array<DataRecord>
    rwnd: Array<DataRecord>
    log: Array<LogRecord>
}

/**
 * Abstract class for different buffer implementations.
 */
export abstract class DataCaptureBuffer {
    /**
     * Pushes a timestamped data sample into the buffer
     * A data sample is meant to be a valid rating provided by the subject in a continuous task 
     * @param timestamp 
     * @param data 
     */
    abstract data(timestamp: number, data: DataSample): void | DataSample
    /**
     * Pushes a timestamped log event into the buffer
     * In contrast with data, log events are auxiliary information about the user experience (eg. user resizes the window)
     * @param timestamp 
     * @param data 
     */
    abstract log(timestamp: number, data: LogSample): void
    /**
     * Returns true if it is possible to rewind the head until 'to' and false otherwise
     * @param to 
     */
    abstract can_rewind(to: number): boolean
    /**
     * Rewinds the head until it reaches a sample with timestamp <= to and returns that sample
     * @param to 
     */
    abstract rewind(to: number): DataSample
    /**
     * async function that should return a promise that is resolved until the buffer is cleared (all data submitted to the server) or error out after a provided timeout
     * If the promise is resolved succesfully the buffer can be destructed without risk of data loss.
     * @param timeout - max time, in milliseconds to wait for the buffer to clear.
     */
    abstract awaitClear(timeout: number): Promise<unknown>
}