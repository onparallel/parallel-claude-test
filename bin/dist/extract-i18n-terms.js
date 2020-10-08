"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const json_1 = require("./utils/json");
const run_1 = require("./utils/run");
const isWindows = process.platform === "win32";
async function extract(locales, input, output) {
    const terms = await extractTerms(input);
    let first = true;
    for (const locale of locales) {
        const data = await loadLocaleData(output, locale);
        if (first) {
            logStats(terms, data);
        }
        const updated = updateLocaleData(first, data, terms);
        await json_1.writeJson(path_1.default.join(output, `${locale}.json`), updated, {
            pretty: true,
        });
        first = false;
    }
}
async function extractTerms(input) {
    try {
        const tmpFileName = "lang_tmp.json";
        child_process_1.execSync(`formatjs extract \
       --extract-source-location \
       --extract-from-format-message-call \
       --throws \
       --out-file ${tmpFileName} \
      ${isWindows ? input : `'${input}'`}`, { encoding: "utf-8" });
        const terms = await json_1.readJson(tmpFileName);
        await fs_1.promises.unlink(tmpFileName);
        return terms;
    }
    catch (error) {
        console.log(chalk_1.default `[ {red error} ]`, error.stderr);
        throw error;
    }
}
async function loadLocaleData(dir, locale) {
    try {
        const terms = await json_1.readJson(path_1.default.join(dir, `${locale}.json`));
        const data = new Map();
        for (const { term, definition, context } of terms) {
            data.set(term, { term, definition, context });
        }
        return data;
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return new Map();
        }
        else {
            throw error;
        }
    }
}
function updateLocaleData(isDefault, data, terms) {
    const updated = new Map();
    for (const [id, term] of Object.entries(terms)) {
        const entry = data.has(id)
            ? data.get(id)
            : {
                term: id,
                definition: "",
                context: "",
            };
        if (isDefault) {
            entry.definition = term.defaultMessage;
        }
        entry.context = term.description || term.defaultMessage;
        updated.set(entry.term, entry);
    }
    return Array.from(updated.values()).sort((a, b) => a.term.localeCompare(b.term));
}
function logStats(terms, data) {
    const set = new Set(Object.keys(terms));
    const added = Object.keys(terms).filter((t) => !data.has(t));
    const removed = Array.from(data.values()).filter((t) => !set.has(t.term));
    console.log(chalk_1.default.green.bold(`Terms added (${added.length}):`));
    for (const term of added) {
        console.log(`- ${term}`);
    }
    console.log(chalk_1.default.red.bold(`Terms removed (${removed.length}):`));
    for (const term of removed) {
        console.log(`- ${term.term}`);
    }
}
async function main() {
    const { locales, input, output } = yargs_1.default
        .option("locales", {
        required: true,
        array: true,
        type: "string",
        description: "The locales to extract. First option will be considered the default one",
    })
        .option("input", {
        required: true,
        type: "string",
        description: "Files to extract terms from",
    })
        .option("output", {
        required: true,
        type: "string",
        description: "Directory to place the extracted terms",
    }).argv;
    await extract(locales, input, output);
}
run_1.run(main);
