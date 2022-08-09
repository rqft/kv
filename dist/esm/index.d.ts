export declare type Value = string | number | boolean | null | ValueObject | ValueArray | undefined;
export declare type Typeof = "bigint" | "boolean" | "function" | "number" | "object" | "string" | "symbol" | "undefined";
export interface ValueObject {
    [property: string]: Value;
}
export interface ValueArray extends Array<Value> {
}
export declare type IO<T> = (input: T) => T;
export declare type Entries = Record<string, Value>;
export declare class Wilson {
    namespace: string;
    constructor(namespace: string);
    path(): string;
    read(): Entries;
    write(data: Entries): this;
    exec(io: IO<Entries>): this;
    get<T extends Value>(key: string): T | undefined;
    put(key: string, value: Value, options?: PutOptions): this;
    cas(key: string, compare: Value | undefined, set: Value | undefined): this;
    casMulti(operations: Array<CasOperation>): this;
    delete(key: string): this;
    clear(): Entries;
    has(key: string): boolean;
    count(): number;
    list(): Array<string>;
    items(): Array<Item>;
    transact(key: string, io: (value: Value) => Value): this | undefined;
    transactMulti(keys: Array<string>, io: (value: Value) => Value): this;
    keys(): IterableIterator<string>;
    values(): IterableIterator<Value>;
    entries(): IterableIterator<[string, Value]>;
    [Symbol.iterator](): IterableIterator<[string, Value]>;
    [Symbol.asyncIterator](): AsyncIterableIterator<[
        string,
        Value
    ]>;
    get [Symbol.toStringTag](): string;
    toString(): string;
    [Symbol.toPrimitive](hint: "default" | "number" | "string"): string | number;
}
export interface PutOptions {
    ifNotExists?: boolean;
}
export interface CasCompareAndSwap {
    compare: Value;
    key: string;
    set: Value;
}
export interface CasDeleteIfEquals {
    compare: Value;
    key: string;
    set: undefined;
}
export interface CasSetIfNotExists {
    compare: undefined;
    key: string;
    set: Value;
}
export declare type CasOperation = CasDeleteIfEquals | CasSetIfNotExists | CasCompareAndSwap;
export interface Item {
    key: string;
    value: Value;
}
