const Buffer = require('buffer/').Buffer
var Parser = require("binary-parser").Parser

export class Packer {

    /**
     * 
     * @param data data points to be packed
     * @param byteOffset offset in bytes
     * @param length length in bytes
     * @param idxs data point indices
     * @param idxsByteOffset offset in bytes
     * @param idxsLength length in bytes
     * @param logs list of log objects
     * @param chunkLength number of data points in the chunk
     * @param recordLength number of record elements
     * @returns binary buffer with packed data
     */
    pack(data: ArrayBuffer, byteOffset: number, length: number,
         idxs: ArrayBuffer, idxsByteOffset: number, idxsLength: number,
         logs: any, chunkLength: number, recordLength: number) {
        const encoder = new TextEncoder()
        const arr = encoder.encode(JSON.stringify(logs))

        const buff1 = Buffer.from(idxs, idxsByteOffset, idxsLength)
        const buff2 = Buffer.from(data, byteOffset, length)
        const buff3 = Buffer.from(arr)

        const header = new Uint32Array(4)
        header[0] = buff1.byteLength + buff2.byteLength
        header[1] = buff3.byteLength
        header[2] = chunkLength
        header[3] = recordLength
        const buff0 = Buffer.from(header.buffer)
        const concat = Buffer.concat([buff0, buff1, buff2, buff3])
        return concat.buffer.slice(
            concat.byteOffset, concat.byteOffset + concat.byteLength
        )
    }

    unpackChunkList(chunkList: ArrayBuffer) {
        const packetParser = new Parser()
            .endianess("little")
            .uint32("dataLength")
            .uint32("logsLength")
            .uint32("chunkLength")
            .uint32("recordLength")
            .buffer("data", { length: "dataLength", clone: true })
            .string("logs", { length: "logsLength", clone: true })

        const chunkListParser = new Parser()
            .endianess("little")
            .uint32("numChunks")
            .array("chunks", {
                type: packetParser,
                length: "numChunks"
            })

        const buf = Buffer.from(chunkList)
        const res = chunkListParser.parse(buf)

        // parse the logs
        res.chunks.forEach((elem: any) => {
            elem.logs = JSON.parse(elem.logs)
        });
        return res
    }

}