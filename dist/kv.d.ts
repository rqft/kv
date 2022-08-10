import { CasOperation, IO, Item, PutOptions, Struct, V } from "./types";
export declare class Wilson<T = Struct> {
    namespace: string;
    constructor(namespace: string);
    path(): string;
    read(): Partial<T>;
    write(data: Partial<T>): this;
    exec(io: IO<Partial<T>>): this;
    get<U extends keyof T>(key: U): V<T[U]> | undefined;
    put<U extends keyof T>(key: U, value: T[U], options?: PutOptions): this;
    cas<U extends keyof T>(key: U, compare: V<T[U]> | undefined, set: V<T[U]> | undefined): this;
    casMulti<U extends keyof T>(operations: Array<CasOperation<T, U>>): this;
    delete<U extends keyof T>(key: U): this;
    clear(): Partial<T>;
    has<U extends keyof T>(key: U): boolean;
    count(): number;
    list(): Array<keyof T>;
    items(): Array<Item<T, keyof T>>;
    transact<U extends keyof T>(key: U, io: IO<V<T[U]>>): this | undefined;
    transactMulti<U extends Array<keyof T>>(keys: U, io: IO<V<T[U[number]]>>): this;
    keys(): IterableIterator<keyof T>;
    values(): IterableIterator<V<T[keyof T]>>;
    entries(): IterableIterator<[keyof T, V<T[keyof T]>]>;
    [Symbol.iterator](): IterableIterator<[keyof T, V<T[keyof T]>]>;
    [Symbol.asyncIterator](): AsyncIterableIterator<[
        keyof T,
        V<T[keyof T]>
    ]>;
    get [Symbol.toStringTag](): string;
    toString(): string;
    [Symbol.toPrimitive](hint: "default" | "number" | "string"): string | number;
}
