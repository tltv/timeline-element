export declare class BlockRowData {
    blocks: Map<string, any>;
    blockLength: Map<string, number>;
    size(): number;
    getBlock(key: string): any;
    getBlockEntries(): IterableIterator<[string, any]>;
    setBlock(key: string, element: any): void;
    getBlockLength(key: string): number;
    setBlockLength(key: string, length: number): void;
    clear(): void;
}
