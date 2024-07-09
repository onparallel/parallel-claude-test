"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timezone_support_1 = require("timezone-support");
const yargs_1 = __importDefault(require("yargs"));
const json_1 = require("./utils/json");
const run_1 = require("./utils/run");
async function main() {
    const { output } = await yargs_1.default.option("output", {
        required: true,
        type: "string",
        description: "Directory to place JSON list",
    }).argv;
    await (0, json_1.writeJson)(output, (0, timezone_support_1.listTimeZones)());
}
(0, run_1.run)(main);
