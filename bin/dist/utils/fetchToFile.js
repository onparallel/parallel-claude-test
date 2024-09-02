"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchToFile = fetchToFile;
const fs_1 = require("fs");
const stream_1 = require("stream");
async function fetchToFile(input, ...args) {
    const [init, path] = typeof args[0] === "string" ? [{}, args[0]] : args;
    const res = await fetch(input, init);
    if (res.ok) {
        return new Promise((resolve, reject) => {
            stream_1.Readable.fromWeb(res.body).pipe((0, fs_1.createWriteStream)(path).once("error", reject).once("close", resolve));
        });
    }
    else {
        throw new Error("Error fetching resource");
    }
}
