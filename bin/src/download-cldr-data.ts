import cldr from "cldr";
import ccl from "country-codes-list";
import { filter, forEach, map, pipe, sort } from "remeda";
import { assert } from "ts-essentials";
import yargs from "yargs";
import { writeJson } from "./utils/json";
import { run } from "./utils/run";

let CURRENCIES: Map<
  string,
  {
    state: string;
    name: string;
    symbol: string;
    code: string;
    fractionalUnitName: string;
    fractionalUnit: number;
  }
> | null = null;
async function getCurrencies() {
  if (CURRENCIES) {
    return CURRENCIES;
  } else {
    const tables: string[][][] = await (
      await fetch("https://www.wikitable2json.com/api/List_of_circulating_currencies?table=0")
    ).json();
    const data = tables[0];
    // if any of these asserts fails make sure the table still has the same structure and correct code accordingly
    [
      "State / Territory[2]",
      "Currency[2][3]",
      "Symbol[upper-alpha 4] orAbbrev.[4]",
      "ISO code[3]",
      "Fractionalunit",
      "Numberto basic",
    ].forEach((header, i) =>
      assert(data[0][i] === header, `Header ${i} mismatch, please check table structure`),
    );
    return (CURRENCIES = new Map(
      data
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
        ]),
    ));
  }
}

async function main() {
  const { output, locales, dataset } = await yargs
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
      choices: ["country-names", "currency-names", "currency-basic-unit"] as const,
      description: "The dataset to extract.",
    }).argv;

  async function getData(type: typeof dataset, locale: string) {
    switch (type) {
      case "country-names": {
        const countries = new Set(ccl.all().map((x) => x.countryCode));
        return pipe(
          cldr.extractTerritoryDisplayNames(locale) as Record<string, string>,
          Object.entries,
          filter(([code]) => countries.has(code)),
          forEach(([, name]) => assert(typeof name === "string")),
          sort(([, a], [, b]) => a.localeCompare(b)),
          Object.fromEntries,
        );
      }
      case "currency-names": {
        const currencies = await getCurrencies();
        return pipe(
          cldr.extractCurrencyInfoById(locale),
          Object.entries,
          filter(([code]) => currencies.has(code)),
          forEach(([, data]) => assert(typeof data.displayName === "string")),
          sort(([, a], [, b]) => a.displayName.localeCompare(b.displayName)),
          map(([code, data]) => [code, [data.displayName, data.symbol]]),
          Object.fromEntries,
        );
      }
      case "currency-basic-unit": {
        const currencies = await getCurrencies();
        return Object.fromEntries([...currencies.values()].map((x) => [x.code, x.fractionalUnit]));
      }
    }
  }

  for (const locale of locales) {
    await writeJson(output.replace("#LOCALE#", locale), await getData(dataset, locale));
  }
}

run(main);
