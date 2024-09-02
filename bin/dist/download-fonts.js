"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const p_map_1 = __importDefault(require("p-map"));
const path_1 = require("path");
const yargs_1 = __importDefault(require("yargs"));
const fetchToFile_1 = require("./utils/fetchToFile");
const json_1 = require("./utils/json");
const run_1 = require("./utils/run");
async function main() {
    const { outputManifest, fonts, output } = await yargs_1.default
        .option("fonts", {
        required: true,
        type: "string",
        array: true,
        description: "fonts to download",
    })
        .option("output", {
        required: true,
        type: "string",
        description: "Directory to place fonts",
    })
        .option("output-manifest", {
        required: true,
        type: "string",
        array: true,
        description: "where to put the manifest json file",
    }).argv;
    const res = await fetch(`https://webfonts.googleapis.com/v1/webfonts?${new URLSearchParams({
        fields: ["items.files", "items.family"].join(","),
        key: "AIzaSyBpQsEEScqktyrQeEGfm5R0UIMivXAlhw8",
    })}`);
    const { items: availableFonts } = (await res.json());
    const results = [];
    await (0, p_map_1.default)(fonts, async (family) => {
        const [name, alias] = family.includes("@") ? family.split("@") : [family, family];
        const familyDir = (0, path_1.join)(output, alias);
        const result = {
            family: alias,
            fonts: [],
        };
        results.push(result);
        try {
            await (0, promises_1.rm)(familyDir, { recursive: true });
        }
        catch { }
        await (0, promises_1.mkdir)(familyDir);
        console.log(`Downloading ${name}`);
        const { files } = availableFonts.find((f) => f.family === name);
        for (const [descriptor, url] of Object.entries(files)) {
            const sourceUrl = `${descriptor}.ttf`;
            if (descriptor === "regular") {
                result.fonts.push({ src: sourceUrl });
            }
            else if (descriptor === "italic") {
                result.fonts.push({
                    src: sourceUrl,
                    fontStyle: "italic",
                });
            }
            else {
                const match = descriptor.match(/^(\d{3})(italic)?$/);
                if (match) {
                    const [_, fontWeight, italic] = match;
                    result.fonts.push({
                        src: sourceUrl,
                        fontStyle: italic,
                        fontWeight: parseInt(fontWeight),
                    });
                }
            }
            const dest = (0, path_1.join)(familyDir, `${descriptor}.ttf`);
            await (0, fetchToFile_1.fetchToFile)(url, dest);
        }
    }, { concurrency: 1 });
    for (const path of outputManifest) {
        await (0, json_1.writeJson)(path, results);
    }
}
(0, run_1.run)(main);
