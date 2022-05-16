"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const fs_1 = require("fs");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
async function stripJs(input) {
    const file = await fs_1.promises.readFile(input);
    const html = (0, cheerio_1.load)(file);
    html("script").remove();
    html(`link[as="script"]`).remove();
    await fs_1.promises.writeFile(input, html.html());
}
async function main() {
    const { input } = await yargs_1.default.option("input", {
        required: true,
        type: "string",
        description: "Files to strip js from",
    }).argv;
    await stripJs(input);
}
(0, run_1.run)(main);
