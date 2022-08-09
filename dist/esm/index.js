import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
export class Wilson {
    constructor(namespace) {
        this.namespace = namespace;
    }
    path() {
        return path.resolve(process.cwd(), `${this.namespace}.json`);
    }
    read() {
        return JSON.parse(fs.readFileSync(this.path(), "utf8"));
    }
    write(data) {
        const existing = this.read();
        if (JSON.stringify(existing) === JSON.stringify(data)) {
            return this;
        }
        fs.writeFileSync(this.path(), JSON.stringify(data, null, 2), "utf8");
        return this;
    }
    exec(io) {
        const data = this.read();
        this.write(io(data));
        return this;
    }
    get(key) {
        const data = this.read();
        return data[key];
    }
    put(key, value, options = {}) {
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
    cas(key, compare, set) {
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
    casMulti(operations) {
        for (const operation of operations) {
            this.cas(operation.key, operation.compare, operation.set);
        }
        return this;
    }
    delete(key) {
        return this.exec((data) => {
            delete data[key];
            return data;
        });
    }
    clear() {
        const data = this.read();
        this.write({});
        return data;
    }
    has(key) {
        const data = this.read();
        return data.hasOwnProperty(key);
    }
    count() {
        return Array.from(this.list()).length;
    }
    list() {
        return Object.keys(this.read());
    }
    items() {
        const entries = Object.entries(this.read());
        return entries.map(([key, value]) => ({ key, value }));
    }
    transact(key, io) {
        const item = this.get(key);
        if (item) {
            let o = io(item);
            return this.cas(key, undefined, o);
        }
    }
    transactMulti(keys, io) {
        for (const key of keys) {
            this.transact(key, io);
        }
        return this;
    }
    *keys() {
        for (const key of this.list()) {
            yield key;
        }
    }
    *values() {
        for (const item of this.items()) {
            yield item.value;
        }
    }
    *entries() {
        for (const [key, value] of Object.entries(this.read())) {
            yield [key, value];
        }
    }
    *[Symbol.iterator]() {
        for (const [key, value] of this.entries()) {
            yield [key, value];
        }
    }
    async *[Symbol.asyncIterator]() {
        for (const [key, value] of this.entries()) {
            yield [key, value];
        }
    }
    get [Symbol.toStringTag]() {
        return this.toString();
    }
    toString() {
        return `Wilson (${this.namespace}) (${this.count()} items)`;
    }
    [Symbol.toPrimitive](hint) {
        switch (hint) {
            case "default":
            case "string":
                return this.toString();
            case "number":
                return this.count();
        }
    }
}
