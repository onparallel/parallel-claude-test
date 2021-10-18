import chalk from "chalk";
import { promises as fs } from "fs";
import { MessageFormatElement, parse, TYPE } from "@formatjs/icu-messageformat-parser";
import outdent from "outdent";
import path from "path";
import { difference, uniq } from "remeda";
import yargs from "yargs";
import { Term } from "./extract-i18n-terms";
import { readJson, writeJson } from "./utils/json";
import { warn } from "./utils/log";
import { run } from "./utils/run";

const WHITELISTED_EXTRA_TERMS = ["tone"];

async function generate(
  locales: string[],
  input: string,
  rawOutput: string | null,
  compiledOutput: string | null
) {
  // store the values used in the default (first) locale to make sure they
  // are used in all the other locales
  const values: { [term: string]: string[] } = {};
  for (const locale of locales) {
    const terms = await readJson<Term[]>(path.join(input, `${locale}.json`));
    const raw: { [term: string]: string } = {};
    const compiled: { [term: string]: MessageFormatElement[] } = {};
    let missing = 0;
    for (const { term, definition } of terms) {
      if (definition === "") {
        missing += 1;
      }
      raw[term] = definition;
      if (compiledOutput) {
        compiled[term] = parse(definition);
      }
      if (locale === locales[0]) {
        values[term] = getValues(compiled[term]);
      } else {
        const reference = values[term];
        const termValues = getValues(compiled[term]);
        const missing = difference(reference, termValues);
        if (missing.length) {
          warn(
            `Term "${term}" (${locale}) is missing the following values: ${missing
              .map((v) => `"${v}"`)
              .join(", ")}`
          );
        }
        const extra = difference(termValues, [...reference, ...WHITELISTED_EXTRA_TERMS]);
        if (extra.length) {
          warn(
            `Term "${term}" (${locale}) has some extra values: ${extra
              .map((v) => `"${v}"`)
              .join(", ")}`
          );
        }
      }
    }
    if (rawOutput) {
      await writeJson(path.join(rawOutput, `${locale}.json`), raw);
      await fs.writeFile(
        path.join(rawOutput, `${locale}.js`),
        outdent`
          window.__LOCALE__ = "${locale}";
          window.__LOCALE_DATA__ = ${JSON.stringify(raw)};
        `,
        "utf-8"
      );
    }
    if (compiledOutput) {
      await writeJson(path.join(compiledOutput, `${locale}.json`), compiled);
      await fs.writeFile(
        path.join(compiledOutput, `${locale}.js`),
        outdent`
          window.__LOCALE__ = "${locale}";
          window.__LOCALE_DATA__ = ${JSON.stringify(compiled)};
        `,
        "utf-8"
      );
    }
    if (missing > 0) {
      warn(`Locale ${chalk.bold(locale)} is missing ${missing} translations.`);
      throw new Error();
    }
  }
}

function getValues(elements: MessageFormatElement[]): string[] {
  return uniq(
    elements.flatMap((element) => {
      switch (element.type) {
        case TYPE.literal:
          return [];
        case TYPE.argument:
        case TYPE.number:
        case TYPE.date:
        case TYPE.time:
          return [element.value];
        case TYPE.select:
        case TYPE.plural:
          return [
            element.value,
            ...Object.values(element.options).flatMap((option) => getValues(option.value)),
          ];
        case TYPE.pound:
          return [];
        case TYPE.tag:
          return [element.value, ...getValues(element.children)];
      }
    })
  );
}

async function main() {
  const { locales, input, outputRaw, outputCompiled } = await yargs
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
  await generate(locales, input, outputRaw as string, outputCompiled as string);
}

run(main);
