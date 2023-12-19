"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const json_1 = require("./utils/json");
const run_1 = require("./utils/run");
async function main() {
    const { output, locales } = await yargs_1.default
        .option("output", {
        required: true,
        type: "string",
        description: "Directory to place the images",
    })
        .option("locales", {
        required: true,
        array: true,
        type: "string",
        description: "The locales to extract.",
    }).argv;
    for (const locale of locales) {
        const res = await (0, node_fetch_1.default)(`https://raw.githubusercontent.com/michaelwittig/node-i18n-iso-countries/master/langs/${locale}.json`);
        const json = await res.json();
        await (0, json_1.writeJson)(path_1.default.join(output, `countries_${locale}.json`), json.countries);
    }
}
(0, run_1.run)(main);
