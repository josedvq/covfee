
from construct import Struct, Int32ul, Bytes, this
# const packetParser = new Parser()
#     .endianess("little")
#     .uint32("dataLength")
#     .uint32("logsLength")
#     .uint32("chunkLength")
#     .uint32("recordLength")
#     .buffer("data", {length: "dataLength", clone: true})
#     .string("logs", {length: "logsLength", clone: true})


class Packer:

    def __init__(self):
        self.packetStruct = Struct(
            'dataLength' / Int32ul,
            'logsLength' / Int32ul,
            'chunkLength' / Int32ul,
            'recordLength' / Int32ul,
            'data' / Bytes(this.dataLength),
            'logs' / Bytes(this.logsLength)
        )

    def parseChunk(self, chunk):
        parsed = self.packetStruct.parse(chunk)
        return parsed
