const Buffer = require('buffer/').Buffer
var Parser = require("binary-parser").Parser

export class Packer {

    pack(data: ArrayBuffer, logs: any, chunkLength: number, recordLength: number) {
        const encoder = new TextEncoder()
        const arr = encoder.encode(JSON.stringify(logs))

        const buff1 = Buffer.from(data)
        const buff2 = Buffer.from(arr)

        const header = new Uint32Array(4)
        header[0] = buff1.byteLength
        header[1] = buff2.byteLength
        header[2] = chunkLength
        header[3] = recordLength
        const buff0 = Buffer.from(header.buffer)
        const concat = Buffer.concat([buff0, buff1, buff2])
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