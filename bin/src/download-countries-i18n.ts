import fetch from "node-fetch";
import path from "path";
import yargs from "yargs";
import { writeJson } from "./utils/json";
import { run } from "./utils/run";

async function main() {
  const { output, locales } = await yargs
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
    }).argv;

  for (const locale of locales) {
    const res = await fetch(
      `https://raw.githubusercontent.com/michaelwittig/node-i18n-iso-countries/master/langs/${locale}.json`,
    );
    const json = await res.json();
    await writeJson(path.join(output, `countries_${locale}.json`), json.countries);
  }
}

run(main);
