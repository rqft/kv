import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { CasOperation, IO, Item, PutOptions, Struct, V } from "./types";

export class Wilson<T = Struct> {
  public namespace: string;
  constructor(namespace: string) {
    this.namespace = namespace;
  }
  public path() {
    return path.resolve(process.cwd(), `${this.namespace}.json`);
  }
  public read(): Partial<T> {
    return JSON.parse(fs.readFileSync(this.path(), "utf8"));
  }
  public write(data: Partial<T>) {
    const existing = this.read();
    if (JSON.stringify(existing) === JSON.stringify(data)) {
      return this;
    }
    fs.writeFileSync(this.path(), JSON.stringify(data, null, 2), "utf8");
    return this;
  }
  public exec(io: IO<Partial<T>>) {
    const data = this.read();
    this.write(io(data));
    return this;
  }
  public get<U extends keyof T>(key: U): V<T[U]> | undefined {
    const data = this.read();
    return data[key] as V<T[U]>;
  }
  public put<U extends keyof T>(
    key: U,
    value: T[U],
    options: PutOptions = {}
  ): this {
    const item = this.get(key);
    if (item) {
      if (item === value) {
        return this;
      }
      if (options.ifNotExists) {
        throw new Error(`${String(key)} already exists`);
      }
    }
    return this.exec((data) => {
      data[key] = value;
      return data;
    });
  }

  public cas<U extends keyof T>(
    key: U,
    compare: V<T[U]> | undefined,
    set: V<T[U]> | undefined
  ): this {
    const item = this.get(key);

    if (item && item === compare) {
      throw new Error(`${String(key)} is already ${compare}`);
    }

    this.exec((data) => {
      data[key] = set;
      return data;
    });
    return this;
  }

  public casMulti<U extends keyof T>(operations: Array<CasOperation<T, U>>) {
    for (const operation of operations) {
      this.cas(operation.key, operation.compare!, operation.set!);
    }
    return this;
  }

  public delete<U extends keyof T>(key: U): this {
    return this.exec((data) => {
      delete data[key];
      return data;
    });
  }

  public clear(): Partial<T> {
    const data = this.read();
    this.write({});
    return data;
  }

  public has<U extends keyof T>(key: U): boolean {
    const data = this.read();
    return data.hasOwnProperty(key);
  }

  public count(): number {
    return Array.from(this.list()).length;
  }

  public list(): Array<keyof T> {
    return Object.keys(this.read()) as Array<keyof T>;
  }

  public items(): Array<Item<T, keyof T>> {
    const entries = Object.entries(this.read());
    return entries.map(([key, value]) => ({
      key: key as keyof T,
      value: value as V<T[keyof T]>,
    }));
  }

  public transact<U extends keyof T>(key: U, io: IO<V<T[U]>>) {
    const item = this.get(key);
    if (item) {
      let o = io(item);
      return this.cas(key, undefined, o);
    }
  }

  public transactMulti<U extends Array<keyof T>>(
    keys: U,
    io: IO<V<T[U[number]]>>
  ) {
    for (const key of keys) {
      this.transact(key, io);
    }
    return this;
  }

  public *keys(): IterableIterator<keyof T> {
    for (const key of this.list()) {
      yield key;
    }
  }

  public *values(): IterableIterator<V<T[keyof T]>> {
    for (const item of this.items()) {
      yield item.value;
    }
  }

  public *entries(): IterableIterator<[keyof T, V<T[keyof T]>]> {
    for (const [key, value] of Object.entries(this.read())) {
      yield [key as keyof T, value as V<T[keyof T]>];
    }
  }

  public *[Symbol.iterator](): IterableIterator<[keyof T, V<T[keyof T]>]> {
    for (const [key, value] of this.entries()) {
      yield [key, value];
    }
  }

  public async *[Symbol.asyncIterator](): AsyncIterableIterator<
    [keyof T, V<T[keyof T]>]
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
