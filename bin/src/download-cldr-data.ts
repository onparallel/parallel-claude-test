import cldr from "cldr";
import ccl from "country-codes-list";
import { filter, forEach, map, pipe, sort } from "remeda";
import { assert } from "ts-essentials";
import yargs from "yargs";
import { writeJson } from "./utils/json";
import { run } from "./utils/run";

let CURRENCIES: Set<string> | null = null;
async function getCurrencies() {
  if (CURRENCIES) {
    return CURRENCIES;
  } else {
    const tables: string[][][] = await (
      await fetch("https://www.wikitable2json.com/api/List_of_circulating_currencies?table=0")
    ).json();
    const data = tables[0];
    assert(data[0][3].startsWith("ISO code"));
    return (CURRENCIES = new Set(
      data
        .slice(1)
        .filter((row) => row[3] !== "(none)")
        .map((row) => row[3]),
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
      choices: ["country-names", "currency-names"] as const,
      description: "The dataset to extract.",
    }).argv;

  async function getData(type: typeof dataset, locale: string) {
    switch (type) {
      case "country-names":
        const countries = new Set(ccl.all().map((x) => x.countryCode));
        return pipe(
          cldr.extractTerritoryDisplayNames(locale) as Record<string, string>,
          Object.entries,
          filter(([code]) => countries.has(code)),
          forEach(([, name]) => assert(typeof name === "string")),
          sort(([, a], [, b]) => a.localeCompare(b)),
          Object.fromEntries,
        );
      case "currency-names":
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
  }

  for (const locale of locales) {
    await writeJson(output.replace("#LOCALE#", locale), await getData(dataset, locale));
  }
}

run(main);
