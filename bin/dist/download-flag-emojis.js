"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const run_1 = require("./utils/run");
const node_fetch_1 = __importDefault(require("node-fetch"));
const p_map_1 = __importDefault(require("p-map"));
const yargs_1 = __importDefault(require("yargs"));
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const cli_progress_1 = require("cli-progress");
async function main() {
    const { output } = await yargs_1.default.option("output", {
        required: true,
        type: "string",
        description: "Directory to place the images",
    }).argv;
    const res = await (0, node_fetch_1.default)("https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/data/openmoji.json");
    const data = await res.json();
    const flags = data.filter((element) => element.group === "flags" && element.subgroups === "country-flag");
    const bar = new cli_progress_1.SingleBar({}, cli_progress_1.Presets.shades_classic);
    bar.start(flags.length, 0);
    await (0, p_map_1.default)(flags, async (element) => {
        const match = element.tags.match(/^([A-Z]{2}),/);
        if (match === null || match === void 0 ? void 0 : match[1]) {
            const code = match === null || match === void 0 ? void 0 : match[1];
            const file = await (0, node_fetch_1.default)(`https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/72x72/${element.hexcode}.png`);
            await (0, promises_1.writeFile)(path_1.default.join(output, `${code.toLowerCase()}.png`), await file.buffer(), "binary");
            bar.increment(1);
        }
    }, { concurrency: 20 });
    bar.stop();
}
(0, run_1.run)(main);
