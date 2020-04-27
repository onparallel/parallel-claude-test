"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const intl_messageformat_parser_1 = require("intl-messageformat-parser");
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const json_1 = require("./utils/json");
const run_1 = require("./utils/run");
async function generate(locales, input, rawOutput, compiledOutput) {
    for (const locale of locales) {
        const terms = await json_1.readJson(path_1.default.join(input, `${locale}.json`));
        const raw = {};
        const compiled = {};
        let missing = 0;
        for (const { term, definition } of terms) {
            if (definition === "") {
                missing += 1;
            }
            if (rawOutput) {
            }
            raw[term] = definition;
            if (compiledOutput) {
                compiled[term] = intl_messageformat_parser_1.parse(definition);
            }
        }
        if (rawOutput) {
            await json_1.writeJson(path_1.default.join(rawOutput, `${locale}.json`), raw);
        }
        if (compiledOutput) {
            await json_1.writeJson(path_1.default.join(compiledOutput, `${locale}.json`), compiled);
        }
        if (missing > 0) {
            console.log(chalk_1.default.yellow(`Warning: Locale ${chalk_1.default.bold(locale)} is missing ${missing} translations.`));
        }
    }
}
async function main() {
    const { locales, input, outputRaw, outputCompiled } = yargs_1.default
        .option("locales", {
        required: true,
        array: true,
        type: "string",
        description: "The locales to extract. First option will be considered the default one",
    })
        .option("input", {
        required: true,
        type: "string",
        description: "Directory with the translated term files",
    })
        .option("output-raw", {
        required: false,
        type: "string",
        description: "Directory to place generated raw json files",
    })
        .option("output-compiled", {
        required: false,
        type: "string",
        description: "Directory to place generated compiled json files",
    }).argv;
    await generate(locales, input, outputRaw, outputCompiled);
}
run_1.run(main);
