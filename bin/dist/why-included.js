"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const detective_typescript_1 = __importDefault(require("detective-typescript"));
const fast_glob_1 = require("fast-glob");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const remeda_1 = require("remeda");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const outdent_1 = require("outdent");
async function logPath(cwd, from, to) {
    const parent = {};
    const queue = (0, fast_glob_1.sync)(from, {
        cwd,
        ignore: ["../**/*.d.ts"],
    }).map((file) => path_1.default.resolve(cwd, file));
    const files = new Set();
    let file;
    while ((file = queue.pop())) {
        files.add(file);
        const source = await (0, promises_1.readFile)(file, { encoding: "utf-8" });
        const dependencies = (0, detective_typescript_1.default)(source, { jsx: true, skipTypeImports: true });
        for (const dependecy of dependencies) {
            if (dependecy.startsWith("@parallel/")) {
                const [resolved] = (0, fast_glob_1.sync)(path_1.default.resolve(cwd, dependecy.replace("@parallel/", "./")) + ".{ts,tsx}");
                if ((0, remeda_1.isDefined)(resolved) && !files.has(resolved) && !queue.includes(resolved)) {
                    parent[resolved] = file;
                    queue.push(resolved);
                }
            }
            else if (dependecy.startsWith("./") || dependecy.startsWith("../")) {
                const [resolved] = (0, fast_glob_1.sync)(path_1.default.resolve(path_1.default.dirname(file), dependecy) + ".{ts,tsx}");
                if ((0, remeda_1.isDefined)(resolved) && !files.has(resolved) && !queue.includes(resolved)) {
                    parent[resolved] = file;
                    queue.push(resolved);
                }
            }
        }
    }
    let current = path_1.default.resolve(cwd, to);
    while (current) {
        console.log(current);
        current = parent[current];
    }
}
async function main() {
    const { cwd, from, to } = await yargs_1.default
        .help((0, outdent_1.outdent) `
        Logs the path to a certain file from a glob.
        This is useful if you want to investigate why a certain file is in the dependecy tree.
      `)
        .option("cwd", {
        required: true,
        type: "string",
        description: "The working directory",
    })
        .option("from", {
        required: true,
        array: true,
        type: "string",
        description: "Origin file",
    })
        .option("to", {
        required: true,
        type: "string",
        description: "Destination file",
    }).argv;
    logPath(cwd, from, to);
}
(0, run_1.run)(main);
