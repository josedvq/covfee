let dtype_map = {
    'int8': Int8Array,
    'uint8': Uint8Array,
    'int32': Int32Array,
    'uint32': Uint32Array,
    'float32': Float32Array
};

class Parser {
    blocks: Array<number>;
    dtypes: Array<string>;

    constructor() {}

    config(blocks: Array<number>, dtypes: Array<string>) {
        this.blocks = blocks;
        this.dtypes = dtypes;
    }

    parse(data: ArrayBuffer) {
        let byte_offset = 0;
        let arrays = [];
        for(let i = 0; i < this.blocks.length; i++) {
            let array_fn = dtype_map[this.dtypes[i]];
            arrays.push(new array_fn(data, byte_offset, this.blocks[i]));
            byte_offset += this.blocks[i] * array_fn.BYTES_PER_ELEMENT;
        }
        return arrays;
    }
}

export { Parser }