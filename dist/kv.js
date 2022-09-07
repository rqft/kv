"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wilson = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const process = __importStar(require("node:process"));
class Wilson {
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
                throw new Error(`${String(key)} already exists`);
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
            throw new Error(`${String(key)} is already ${compare}`);
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
        return entries.map(([key, value]) => ({
            key: key,
            value: value,
        }));
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
    [Symbol.asyncIterator]() {
        return __asyncGenerator(this, arguments, function* _a() {
            for (const [key, value] of this.entries()) {
                yield yield __await([key, value]);
            }
        });
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
exports.Wilson = Wilson;
