export class BlockRowData {
    constructor() {
        this.blocks = new Map();
        this.blockLength = new Map();
    }
    size() {
        return this.blocks.size;
    }
    getBlock(key) {
        return this.blocks.get(key);
    }
    getBlockEntries() {
        return this.blocks.entries();
    }
    setBlock(key, element) {
        this.blocks.set(key, element);
    }
    getBlockLength(key) {
        return this.blockLength.get(key);
    }
    setBlockLength(key, length) {
        this.blockLength.set(key, length);
    }
    clear() {
        this.blocks.clear();
        this.blockLength.clear();
    }
}
//# sourceMappingURL=blockRowData.js.map