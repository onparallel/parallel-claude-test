import chalk from "chalk";
import { MessageFormatElement, parse } from "intl-messageformat-parser";
import path from "path";
import yargs from "yargs";
import { Term } from "./extract-i18n-terms";
import { readJson, writeJson } from "./utils/json";
import { run } from "./utils/run";

async function generate(
  locales: string[],
  input: string,
  rawOutput: string | null,
  compiledOutput: string | null
) {
  for (const locale of locales) {
    const terms = await readJson<Term[]>(path.join(input, `${locale}.json`));
    const raw: { [term: string]: string } = {};
    const compiled: { [term: string]: MessageFormatElement[] } = {};
    let missing = 0;
    for (const { term, definition } of terms) {
      if (definition === "") {
        missing += 1;
      }
      if (rawOutput) {
      }
      raw[term] = definition;
      if (compiledOutput) {
        compiled[term] = parse(definition);
      }
    }
    if (rawOutput) {
      await writeJson(path.join(rawOutput, `${locale}.json`), raw);
    }
    if (compiledOutput) {
      await writeJson(path.join(compiledOutput, `${locale}.json`), compiled);
    }
    if (missing > 0) {
      console.log(
        chalk.yellow(
          `Warning: Locale ${chalk.bold(
            locale
          )} is missing ${missing} translations.`
        )
      );
    }
  }
}

async function main() {
  const { locales, input, outputRaw, outputCompiled } = yargs
    .option("locales", {
      required: true,
      array: true,
      type: "string",
      description:
        "The locales to extract. First option will be considered the default one",
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
  await generate(locales, input, outputRaw as string, outputCompiled as string);
}

run(main);
