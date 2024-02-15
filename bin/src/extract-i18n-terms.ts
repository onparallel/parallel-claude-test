/** no-recipient */
import { extract } from "@formatjs/cli-lib";
import chalk from "chalk";
import detective from "detective-typescript";
import { sync as globSync } from "fast-glob";
import { readFile } from "fs/promises";
import path from "path";
import { readJson, writeJson } from "./utils/json";
import { run } from "./utils/run";
import yargs from "yargs";
import { isDefined } from "remeda";

export interface Term {
  term: string;
  definition: string;
  context: string;
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

async function extractTerms(cwd: string, glob: string | string[], excludePragma?: string) {
  const queue = globSync(glob, {
    cwd,
    ignore: ["../**/*.d.ts"],
  }).map((file) => path.resolve(cwd, file));
  const files = new Set<string>();
  let file: string | undefined;
  const excludeRegex = excludePragma
    ? new RegExp(
        "(^\\/\\/\\s*" + excludePragma + "$|^\\/\\*\\*\\s*" + excludePragma + "\\s*\\*\\/$)",
        "m",
      )
    : undefined;
  while ((file = queue.pop())) {
    const source = await readFile(file, { encoding: "utf-8" });
    if (isDefined(excludeRegex) && source.match(excludeRegex)) {
      continue;
    }
    files.add(file);
    const dependencies = detective(source, { jsx: true, skipTypeImports: true });
    for (const dependecy of dependencies) {
      if (dependecy.startsWith("@parallel/")) {
        const [resolved] = globSync(
          path.resolve(cwd, dependecy.replace("@parallel/", "./")) + ".{ts,tsx}",
        );
        if (isDefined(resolved) && !files.has(resolved) && !queue.includes(resolved)) {
          queue.push(resolved);
        }
      } else if (dependecy.startsWith("./") || dependecy.startsWith("../")) {
        const [resolved] = globSync(path.resolve(path.dirname(file), dependecy) + ".{ts,tsx}");
        if (isDefined(resolved) && !files.has(resolved) && !queue.includes(resolved)) {
          queue.push(resolved);
        }
      }
    }
  }
  const result = await extract([...files.values()], {
    throws: true,
    extractSourceLocation: true,
    additionalFunctionNames: ["getLocalizableUserText"],
  });
  return JSON.parse(result);
}

async function loadLocaleData(dir: string, locale: string) {
  try {
    const terms = await readJson<Term[]>(path.join(dir, `${locale}.json`));
    const data = new Map<string, Term>();
    for (const { term, definition, context } of terms) {
      data.set(term, { term, definition, context });
    }
    return data;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return new Map<string, Term>();
    } else {
      throw error;
    }
  }
}

function updateLocaleData(
  locale: string,
  data: Map<string, Term>,
  terms: Record<string, MessageDescriptor>,
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
    if (locale === "en") {
      entry!.definition = term.defaultMessage;
    }
    entry!.context = term.description || term.defaultMessage;
    updated.set(entry!.term, entry);
  }
  return Array.from(updated.values()).sort((a, b) => a.term.localeCompare(b.term));
}

function logStats(terms: Record<string, MessageDescriptor>, data: Map<string, Term>) {
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
  const { cwd, locales, input, output, excludePragma } = await yargs
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

  const terms = await extractTerms(path.resolve(cwd), input, excludePragma);
  let first = true;
  const outputDir = path.join(process.cwd(), cwd, output);
  for (const locale of locales) {
    const data = await loadLocaleData(outputDir, locale);
    if (first) {
      logStats(terms, data);
    }
    const updated = updateLocaleData(locale, data, terms);
    await writeJson(path.join(outputDir, `${locale}.json`), updated, {
      pretty: true,
    });
    first = false;
  }
}

run(main);
