"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJson = readJson;
exports.writeJson = writeJson;
const fs_1 = require("fs");
async function readJson(path) {
    const contents = await fs_1.promises.readFile(path, "utf-8");
    return JSON.parse(contents);
}
async function writeJson(path, contents, opts) {
    const { pretty } = { pretty: false, ...opts };
    await fs_1.promises.writeFile(path, pretty ? JSON.stringify(contents, null, "  ") : JSON.stringify(contents), "utf-8");
}
