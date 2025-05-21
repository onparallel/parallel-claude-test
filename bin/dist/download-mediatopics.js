"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const json_1 = require("./utils/json");
const run_1 = require("./utils/run");
async function main() {
    const { output } = await yargs_1.default.option("output", {
        required: true,
        type: "string",
        description: "Directory to place the data",
    }).argv;
    async function getData() {
        const data = await (await fetch("https://cv.iptc.org/newscodes/mediatopic?format=json")).json();
        return {
            conceptSet: data.conceptSet.map((c) => ({
                qcode: c.qcode,
                narrower: c.narrower,
            })),
        };
    }
    await (0, json_1.writeJson)(output, await getData());
}
(0, run_1.run)(main);
