"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cldr_1 = __importDefault(require("cldr"));
const country_codes_list_1 = __importDefault(require("country-codes-list"));
const remeda_1 = require("remeda");
const ts_essentials_1 = require("ts-essentials");
const yargs_1 = __importDefault(require("yargs"));
const json_1 = require("./utils/json");
const run_1 = require("./utils/run");
let CURRENCIES = null;
async function getCurrencies() {
    if (CURRENCIES) {
        return CURRENCIES;
    }
    else {
        const tables = await (await fetch("https://www.wikitable2json.com/api/List_of_circulating_currencies?table=0")).json();
        const data = tables[0];
        // if any of these asserts fails make sure the table still has the same structure and correct code accordingly
        [
            "State / Territory[2]",
            "Currency[2][3]",
            "Symbol[upper-alpha 4] orAbbrev.[4]",
            "ISO code[3]",
            "Fractionalunit",
            "Numberto basic",
        ].forEach((header, i) => (0, ts_essentials_1.assert)(data[0][i] === header, `Header ${i} mismatch, please check table structure`));
        return (CURRENCIES = new Map(data
            .slice(1)
            .filter((row) => row[3] !== "(none)" && row.length > 0)
            .map((row) => [
            row[3],
            {
                state: row[0],
                name: row[1],
                symbol: row[2],
                code: row[3],
                fractionalUnitName: row[4],
                fractionalUnit: row[5] === "(none)" ? 1 : parseInt(row[5]),
            },
        ])));
    }
}
async function main() {
    const { output, locales, dataset } = await yargs_1.default
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
    })
        .option("dataset", {
        required: true,
        choices: ["country-names", "currency-names", "currency-basic-unit"],
        description: "The dataset to extract.",
    }).argv;
    async function getData(type, locale) {
        switch (type) {
            case "country-names": {
                const countries = new Set(country_codes_list_1.default.all().map((x) => x.countryCode));
                return (0, remeda_1.pipe)(cldr_1.default.extractTerritoryDisplayNames(locale), Object.entries, (0, remeda_1.filter)(([code]) => countries.has(code)), (0, remeda_1.forEach)(([, name]) => (0, ts_essentials_1.assert)(typeof name === "string")), (0, remeda_1.sort)(([, a], [, b]) => a.localeCompare(b)), Object.fromEntries);
            }
            case "currency-names": {
                const currencies = await getCurrencies();
                return (0, remeda_1.pipe)(cldr_1.default.extractCurrencyInfoById(locale), Object.entries, (0, remeda_1.filter)(([code]) => currencies.has(code)), (0, remeda_1.forEach)(([, data]) => (0, ts_essentials_1.assert)(typeof data.displayName === "string")), (0, remeda_1.sort)(([, a], [, b]) => a.displayName.localeCompare(b.displayName)), (0, remeda_1.map)(([code, data]) => [code, [data.displayName, data.symbol]]), Object.fromEntries);
            }
            case "currency-basic-unit": {
                const currencies = await getCurrencies();
                return Object.fromEntries([...currencies.values()].map((x) => [x.code, x.fractionalUnit]));
            }
        }
    }
    for (const locale of locales) {
        await (0, json_1.writeJson)(output.replace("#LOCALE#", locale), await getData(dataset, locale));
    }
}
(0, run_1.run)(main);
