"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeJson = exports.readJson = void 0;
const fs_1 = require("fs");
async function readJson(path) {
    const contents = await fs_1.promises.readFile(path, "utf-8");
    return JSON.parse(contents);
}
exports.readJson = readJson;
async function writeJson(path, contents, opts) {
    const { pretty } = { pretty: false, ...opts };
    await fs_1.promises.writeFile(path, (pretty ? JSON.stringify(contents, null, "  ") : JSON.stringify(contents)) +
        "\n", "utf-8");
}
exports.writeJson = writeJson;
