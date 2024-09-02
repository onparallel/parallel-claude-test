"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/** no-recipient */
const cli_lib_1 = require("@formatjs/cli-lib");
const chalk_1 = __importDefault(require("chalk"));
const detective_typescript_1 = __importDefault(require("detective-typescript"));
const fast_glob_1 = require("fast-glob");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const remeda_1 = require("remeda");
const yargs_1 = __importDefault(require("yargs"));
const json_1 = require("./utils/json");
const run_1 = require("./utils/run");
async function extractTerms(cwd, glob, excludePragma) {
    const queue = (0, fast_glob_1.sync)(glob, {
        cwd,
        ignore: ["../**/*.d.ts"],
    }).map((file) => path_1.default.resolve(cwd, file));
    const files = new Set();
    let file;
    const excludeRegex = excludePragma
        ? new RegExp("(^\\/\\/\\s*" + excludePragma + "$|^\\/\\*\\*\\s*" + excludePragma + "\\s*\\*\\/$)", "m")
        : undefined;
    while ((file = queue.pop())) {
        const source = await (0, promises_1.readFile)(file, { encoding: "utf-8" });
        if ((0, remeda_1.isNonNullish)(excludeRegex) && source.match(excludeRegex)) {
            continue;
        }
        files.add(file);
        const dependencies = (0, detective_typescript_1.default)(source, { jsx: true, skipTypeImports: true });
        for (const dependecy of dependencies) {
            if (dependecy.startsWith("@parallel/")) {
                const [resolved] = (0, fast_glob_1.sync)(path_1.default.resolve(cwd, dependecy.replace("@parallel/", "./")) + ".{ts,tsx}");
                if ((0, remeda_1.isNonNullish)(resolved) && !files.has(resolved) && !queue.includes(resolved)) {
                    queue.push(resolved);
                }
            }
            else if (dependecy.startsWith("./") || dependecy.startsWith("../")) {
                const [resolved] = (0, fast_glob_1.sync)(path_1.default.resolve(path_1.default.dirname(file), dependecy) + ".{ts,tsx}");
                if ((0, remeda_1.isNonNullish)(resolved) && !files.has(resolved) && !queue.includes(resolved)) {
                    queue.push(resolved);
                }
            }
        }
    }
    const result = await (0, cli_lib_1.extract)([...files.values()], {
        throws: true,
        extractSourceLocation: true,
        additionalFunctionNames: ["getLocalizableUserText"],
        preserveWhitespace: true,
    });
    return JSON.parse(result);
}
async function loadLocaleData(dir, locale) {
    try {
        const terms = await (0, json_1.readJson)(path_1.default.join(dir, `${locale}.json`));
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
function updateLocaleData(locale, data, terms) {
    const updated = new Map();
    for (const [id, term] of Object.entries(terms)) {
        const entry = data.has(id)
            ? data.get(id)
            : {
                term: id,
                definition: "",
                context: "",
            };
        if (locale === "en") {
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
    const { cwd, locales, input, output, excludePragma } = await yargs_1.default
        .option("cwd", {
        required: true,
        type: "string",
        description: "The working directory",
    })
        .option("locales", {
        required: true,
        array: true,
        type: "string",
        description: "The locales to extract. First option will be considered the default one",
    })
        .option("input", {
        required: true,
        type: "string",
        array: true,
        description: "Files to extract terms from",
    })
        .option("exclude-pragma", {
        type: "string",
        description: "Pragma to exclude files",
    })
        .option("output", {
        required: true,
        type: "string",
        description: "Directory to place the extracted terms",
    }).argv;
    const terms = await extractTerms(path_1.default.resolve(cwd), input, excludePragma);
    let first = true;
    const outputDir = path_1.default.join(process.cwd(), cwd, output);
    for (const locale of locales) {
        const data = await loadLocaleData(outputDir, locale);
        if (first) {
            logStats(terms, data);
        }
        const updated = updateLocaleData(locale, data, terms);
        await (0, json_1.writeJson)(path_1.default.join(outputDir, `${locale}.json`), updated, {
            pretty: true,
        });
        first = false;
    }
}
(0, run_1.run)(main);
