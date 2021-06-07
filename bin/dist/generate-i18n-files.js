"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const intl_messageformat_parser_1 = require("intl-messageformat-parser");
const outdent_1 = __importDefault(require("outdent"));
const path_1 = __importDefault(require("path"));
const remeda_1 = require("remeda");
const yargs_1 = __importDefault(require("yargs"));
const json_1 = require("./utils/json");
const log_1 = require("./utils/log");
const run_1 = require("./utils/run");
async function generate(locales, input, rawOutput, compiledOutput) {
    // store the values used in the default (first) locale to make sure they
    // are used in all the other locales
    const values = {};
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
            if (locale === locales[0]) {
                values[term] = getValues(compiled[term]);
            }
            else {
                const reference = values[term];
                const termValues = getValues(compiled[term]);
                const missing = remeda_1.difference(reference, termValues);
                if (missing.length) {
                    log_1.warn(`Term "${term}" (${locale}) is missing the following values: ${missing
                        .map((v) => `"${v}"`)
                        .join(", ")}`);
                }
                const extra = remeda_1.difference(termValues, reference);
                if (extra.length) {
                    log_1.warn(`Term "${term}" (${locale}) has some extra values: ${extra
                        .map((v) => `"${v}"`)
                        .join(", ")}`);
                }
            }
        }
        if (rawOutput) {
            await json_1.writeJson(path_1.default.join(rawOutput, `${locale}.json`), raw);
            await fs_1.promises.writeFile(path_1.default.join(rawOutput, `${locale}.js`), outdent_1.default `
          window.__LOCALE__ = "${locale}";
          window.__LOCALE_DATA__ = ${JSON.stringify(raw)};
        `, "utf-8");
        }
        if (compiledOutput) {
            await json_1.writeJson(path_1.default.join(compiledOutput, `${locale}.json`), compiled);
        }
        if (missing > 0) {
            log_1.warn(`Locale ${chalk_1.default.bold(locale)} is missing ${missing} translations.`);
            throw new Error();
        }
    }
}
function getValues(elements) {
    return remeda_1.uniq(elements.flatMap((element) => {
        switch (element.type) {
            case intl_messageformat_parser_1.TYPE.literal:
                return [];
            case intl_messageformat_parser_1.TYPE.argument:
            case intl_messageformat_parser_1.TYPE.number:
            case intl_messageformat_parser_1.TYPE.date:
            case intl_messageformat_parser_1.TYPE.time:
                return [element.value];
            case intl_messageformat_parser_1.TYPE.select:
            case intl_messageformat_parser_1.TYPE.plural:
                return [
                    element.value,
                    ...Object.values(element.options).flatMap((option) => getValues(option.value)),
                ];
            case intl_messageformat_parser_1.TYPE.pound:
                return [];
            case intl_messageformat_parser_1.TYPE.tag:
                return [element.value, ...getValues(element.children)];
        }
    }));
}
async function main() {
    const { locales, input, outputRaw, outputCompiled } = await yargs_1.default
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
