export declare type Value = string | number | boolean | null | ValueObject | ValueArray | undefined;
export declare type Typeof = "bigint" | "boolean" | "function" | "number" | "object" | "string" | "symbol" | "undefined";
export interface ValueObject {
    [property: string]: Value;
}
export interface ValueArray extends Array<Value> {
}
export declare type IO<T> = (input: T) => T;
export declare type Entries = Record<string, Value>;
export interface PutOptions {
    ifNotExists?: boolean;
}
export interface CasCompareAndSwap<T, U extends keyof T> {
    compare: V<T[U]>;
    key: U;
    set: V<T[U]>;
}
export interface CasDeleteIfEquals<T, U extends keyof T> {
    compare: V<T[U]>;
    key: U;
    set: undefined;
}
export interface CasSetIfNotExists<T, U extends keyof T> {
    compare: undefined;
    key: U;
    set: V<T[U]>;
}
export declare type CasOperation<T, U extends keyof T> = CasDeleteIfEquals<T, U> | CasSetIfNotExists<T, U> | CasCompareAndSwap<T, U>;
export interface Item<T, U extends keyof T> {
    key: U;
    value: V<T[U]>;
}
export declare type Struct = Partial<Entries>;
export declare type V<T> = T extends Value ? T : never;
