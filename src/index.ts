import fs from "node:fs";
import path from "node:path";
export type Value =
  | string
  | number
  | boolean
  | null
  | ValueObject
  | ValueArray
  | undefined;
export type Typeof =
  | "bigint"
  | "boolean"
  | "function"
  | "number"
  | "object"
  | "string"
  | "symbol"
  | "undefined";
export interface ValueObject {
  [property: string]: Value;
}
export interface ValueArray extends Array<Value> {}
export type IO<T> = (input: T) => T;
export type Entries = Record<string, Value>;
export class Wilson {
  public namespace: string;
  constructor(namespace: string) {
    this.namespace = namespace;
  }
  public path() {
    return path.resolve(__dirname, `${this.namespace}.json`);
  }
  public read(): Entries {
    return JSON.parse(fs.readFileSync(this.path(), "utf8"));
  }
  public write(data: Entries) {
    const existing = this.read();
    if (JSON.stringify(existing) === JSON.stringify(data)) {
      return this;
    }
    fs.writeFileSync(this.path(), JSON.stringify(data, null, 2), "utf8");
    return this;
  }
  public exec(io: IO<Entries>) {
    const data = this.read();
    this.write(io(data));
    return this;
  }
  public get<T extends Value>(key: string): T | undefined {
    const data = this.read();
    return data[key] as T;
  }
  public put(key: string, value: Value, options: PutOptions = {}): this {
    const item = this.get(key);
    if (item) {
      if (item === value) {
        return this;
      }
      if (options.ifNotExists) {
        throw new Error(`${key} already exists`);
      }
    }
    return this.exec((data) => {
      data[key] = value;
      return data;
    });
  }

  public cas(
    key: string,
    compare: Value | undefined,
    set: Value | undefined
  ): this {
    const item = this.get(key);

    if (item && item === compare) {
      throw new Error(`${key} is already ${compare}`);
    }

    this.exec((data) => {
      data[key] = set;
      return data;
    });
    return this;
  }

  public casMulti(operations: Array<CasOperation>) {
    for (const operation of operations) {
      this.cas(operation.key, operation.compare!, operation.set!);
    }
    return this;
  }

  public delete(key: string): this {
    return this.exec((data) => {
      delete data[key];
      return data;
    });
  }

  public clear(): Entries {
    const data = this.read();
    this.write({});
    return data;
  }

  public has(key: string): boolean {
    const data = this.read();
    return data.hasOwnProperty(key);
  }

  public count(): number {
    return Array.from(this.list()).length;
  }

  public list(): Array<string> {
    return Object.keys(this.read());
  }
  public items(): Array<Item> {
    const entries = Object.entries(this.read());
    return entries.map(([key, value]) => ({ key, value }));
  }

  public transact(key: string, io: (value: Value) => Value) {
    const item = this.get(key);
    if (item) {
      let o = io(item);
      return this.cas(key, undefined, o);
    }
  }

  public transactMulti(keys: Array<string>, io: (value: Value) => Value) {
    for (const key of keys) {
      this.transact(key, io);
    }
    return this;
  }

  public *keys(): IterableIterator<string> {
    for (const key of this.list()) {
      yield key;
    }
  }

  public *values(): IterableIterator<Value> {
    for (const item of this.items()) {
      yield item.value;
    }
  }

  public *entries(): IterableIterator<[string, Value]> {
    for (const [key, value] of Object.entries(this.read())) {
      yield [key, value];
    }
  }

  public *[Symbol.iterator](): IterableIterator<[string, Value]> {
    for (const [key, value] of this.entries()) {
      yield [key, value];
    }
  }

  public async *[Symbol.asyncIterator](): AsyncIterableIterator<
    [string, Value]
  > {
    for (const [key, value] of this.entries()) {
      yield [key, value];
    }
  }

  get [Symbol.toStringTag]() {
    return this.toString();
  }

  public toString(): string {
    return `Wilson (${this.namespace}) (${this.count()} items)`;
  }

  public [Symbol.toPrimitive](
    hint: "default" | "number" | "string"
  ): string | number {
    switch (hint) {
      case "default":
      case "string":
        return this.toString();
      case "number":
        return this.count();
    }
  }
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
export type CasOperation =
  | CasDeleteIfEquals
  | CasSetIfNotExists
  | CasCompareAndSwap;
export interface Item {
  key: string;
  value: Value;
}
