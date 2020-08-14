import chalk from "chalk";
import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import yargs from "yargs";
import { readJson, writeJson } from "./utils/json";
import { run } from "./utils/run";

const isWindows = process.platform === "win32";

export interface Term {
  term: string;
  definition: string;
  context: string;
}

async function extract(locales: string[], input: string, output: string) {
  const terms = await extractTerms(input);
  let first = true;
  for (const locale of locales) {
    const data = await loadLocaleData(output, locale);
    if (first) {
      logStats(terms, data);
    }
    const updated = updateLocaleData(first, data, terms);
    await writeJson(path.join(output, `${locale}.json`), updated, {
      pretty: true,
    });
    first = false;
  }
}

interface MessageDescriptor {
  description?: string;
  defaultMessage: string;
  file: string;
  start: number;
  end: number;
  line: number;
  col: number;
}

async function extractTerms(input: string) {
  try {
    const tmpFileName = "lang_tmp.json";
    execSync(
      `formatjs extract \
       --extract-source-location \
       --extract-from-format-message-call \
       --throws \
       --out-file ${tmpFileName} \
       ${isWindows ? input.replace("/", "\\") : `'${input}'`}`,
      { encoding: "utf-8" }
    );
    const terms = await readJson<Record<string, MessageDescriptor>>(
      tmpFileName
    );
    await fs.unlink(tmpFileName);
    return terms;
  } catch (error) {
    console.log(chalk`[ {red error} ]`, error.stderr);
    throw error;
  }
}

async function loadLocaleData(dir: string, locale: string) {
  try {
    const terms = await readJson<Term[]>(path.join(dir, `${locale}.json`));
    const data = new Map<string, Term>();
    for (const { term, definition, context } of terms) {
      data.set(term, { term, definition, context });
    }
    return data;
  } catch (error) {
    if (error.code === "ENOENT") {
      return new Map<string, Term>();
    } else {
      throw error;
    }
  }
}

function updateLocaleData(
  isDefault: boolean,
  data: Map<string, Term>,
  terms: Record<string, MessageDescriptor>
) {
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
      entry!.definition = term.defaultMessage;
    }
    entry!.context = term.description || term.defaultMessage;
    updated.set(entry!.term, entry);
  }
  return Array.from(updated.values()).sort((a, b) =>
    a.term.localeCompare(b.term)
  );
}

function logStats(
  terms: Record<string, MessageDescriptor>,
  data: Map<string, Term>
) {
  const set = new Set(Object.keys(terms));
  const added = Object.keys(terms).filter((t) => !data.has(t));
  const removed = Array.from(data.values()).filter((t) => !set.has(t.term));
  console.log(chalk.green.bold(`Terms added (${added.length}):`));
  for (const term of added) {
    console.log(`- ${term}`);
  }
  console.log(chalk.red.bold(`Terms removed (${removed.length}):`));
  for (const term of removed) {
    console.log(`- ${term.term}`);
  }
}

async function main() {
  const { locales, input, output } = yargs
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
      description: "Files to extract terms from",
    })
    .option("output", {
      required: true,
      type: "string",
      description: "Directory to place the extracted terms",
    }).argv;

  await extract(locales, input, output);
}

run(main);
