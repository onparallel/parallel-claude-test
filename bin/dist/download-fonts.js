"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const node_fetch_1 = __importDefault(require("node-fetch"));
const p_map_1 = __importDefault(require("p-map"));
const path_1 = require("path");
const yargs_1 = __importDefault(require("yargs"));
const json_1 = require("./utils/json");
const run_1 = require("./utils/run");
const SELECTION = [
    "IBM Plex Sans",
    "Roboto Slab",
    "Merriweather",
    "Playfair Display",
    "Lora",
    "PT Serif",
    ["Source Serif 4", "Source Serif Pro"],
    "IBM Plex Serif",
    "Cormorant Garamond",
    "Alegreya",
    "Tinos",
    "Libre Baskerville",
    "Noto Serif",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    ["Source Sans 3", "Source Sans Pro"],
    "Noto Sans",
    "Raleway",
    "Nunito",
    "Rubik",
    "Parisienne",
    "Rubik Wet Paint",
    "Inconsolata",
];
async function main() {
    const { output } = await yargs_1.default.option("output", {
        required: true,
        type: "string",
        description: "Directory to place fonts",
    }).argv;
    const res = await (0, node_fetch_1.default)(`https://webfonts.googleapis.com/v1/webfonts?${new URLSearchParams({
        fields: ["items.files", "items.family"].join(","),
        key: "AIzaSyBpQsEEScqktyrQeEGfm5R0UIMivXAlhw8",
    })}`);
    const { items: fonts } = (await res.json());
    const results = [];
    await (0, p_map_1.default)(SELECTION, async (family) => {
        const [name, alias] = Array.isArray(family) ? family : [family, family];
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
        const { files } = fonts.find((f) => f.family === name);
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
            const res = await (0, node_fetch_1.default)(url);
            const dest = (0, path_1.join)(familyDir, `${descriptor}.ttf`);
            await new Promise((resolve, reject) => res.body.pipe((0, fs_1.createWriteStream)(dest)).on("error", reject).on("close", resolve));
        }
    }, {
        concurrency: 1,
    });
    await (0, json_1.writeJson)((0, path_1.join)(output, "fonts.json"), results);
}
(0, run_1.run)(main);
