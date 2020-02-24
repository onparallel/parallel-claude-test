import chalk from "chalk";
import { promises as fs } from "fs";
import { promisify } from "util";
import cp from "child_process";
import { readJson, writeJson } from "./utils";
import languages from "../client/lang/languages.json";
import path from "path";
import yargs from "yargs";

interface Language {
  locale: string;
  text: string;
  default?: boolean;
}

const exec = promisify(cp.exec);

const isWindows = process.platform === "win32";

export interface Term {
  term: string;
  definition: string;
  context: string;
  reference: string;
}

async function extract(input: string, output: string) {
  const terms = await extractTerms(input);
  for (const language of languages) {
    const data = await loadLocaleData(output, language.locale);
    if (language.default) {
      logStats(terms, data);
    }
    const updated = updateLocaleData(language, data, terms);
    await writeJson(path.join(output, `${language.locale}.json`), updated, {
      pretty: true
    });
  }
}

interface ExtractedTerm {
  id: string;
  defaultMessage: string;
  description?: string;
  file: string;
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
}

async function extractTerms(input: string) {
  try {
    const tmpFileName = "lang_tmp.json";
    await exec(
      `formatjs extract \
       --extract-source-location \
       --extract-from-format-message-call \
       --out-file ${tmpFileName} \
       ${isWindows ? input.replace("/", "\\") : `'${input}'`}`
    );
    const terms = await readJson<ExtractedTerm[]>(tmpFileName);
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
    for (const term of terms) {
      data.set(term.term, term);
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
  { locale, default: defaultLanguage }: Language,
  data: Map<string, Term>,
  terms: ExtractedTerm[]
) {
  const updated = new Map();
  for (const term of terms) {
    const entry = data.has(term.id)
      ? data.get(term.id)
      : {
          term: term.id,
          definition: "",
          context: "",
          reference: ""
        };
    if (defaultLanguage) {
      entry!.definition = term.defaultMessage;
    }
    entry!.context = term.description || term.defaultMessage;
    const range =
      term.start.line !== term.end.line
        ? `L${term.start.line}-L${term.end.line}`
        : `L${term.start.line}`;
    const path = isWindows
      ? term.file.replace(/^\.\.\\[^\\]+\\/, "").replace(/\\/g, "/")
      : term.file.replace(/^\.\.\/[^/]+\//, "");
    entry!.reference = `${path}#${range}`;
    updated.set(entry!.term, entry);
  }
  return Array.from(updated.values()).sort((a, b) =>
    a.term.localeCompare(b.term)
  );
}

function logStats(terms: ExtractedTerm[], data: Map<string, Term>) {
  const set = new Set(terms.map(t => t.id));
  const added = terms.filter(t => !data.has(t.id));
  const removed = Array.from(data.values()).filter(t => !set.has(t.term));
  console.log(chalk.green.bold(`Terms added (${added.length}):`));
  for (const term of added) {
    console.log(`- ${term.id}`);
  }
  console.log(chalk.red.bold(`Terms removed (${removed.length}):`));
  for (const term of removed) {
    console.log(`- ${term.term}`);
  }
}

async function main() {
  const { input, output } = yargs
    .option("input", {
      required: true,
      type: "string",
      description: "Files to extract terms from"
    })
    .option("output", {
      required: true,
      type: "string",
      description: "Directory to place the extracted terms"
    }).argv;

  await extract(input, output);
}
main().then();
