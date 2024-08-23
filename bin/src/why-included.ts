import detective from "detective-typescript";
import { sync as globSync } from "fast-glob";
import { readFile } from "fs/promises";
import { outdent } from "outdent";
import path from "path";
import { isNonNullish } from "remeda";
import yargs from "yargs";
import { run } from "./utils/run";

async function logPath(cwd: string, from: string | string[], to: string) {
  const parent: Record<string, string> = {};
  const queue = globSync(from, {
    cwd,
    ignore: ["../**/*.d.ts"],
  }).map((file) => path.resolve(cwd, file));
  const files = new Set<string>();
  let file: string | undefined;
  while ((file = queue.pop())) {
    files.add(file);
    const source = await readFile(file, { encoding: "utf-8" });
    const dependencies = detective(source, { jsx: true, skipTypeImports: true });
    for (const dependecy of dependencies) {
      if (dependecy.startsWith("@parallel/")) {
        const [resolved] = globSync(
          path.resolve(cwd, dependecy.replace("@parallel/", "./")) + ".{ts,tsx}",
        );
        if (isNonNullish(resolved) && !files.has(resolved) && !queue.includes(resolved)) {
          parent[resolved] = file;
          queue.push(resolved);
        }
      } else if (dependecy.startsWith("./") || dependecy.startsWith("../")) {
        const [resolved] = globSync(path.resolve(path.dirname(file), dependecy) + ".{ts,tsx}");
        if (isNonNullish(resolved) && !files.has(resolved) && !queue.includes(resolved)) {
          parent[resolved] = file;
          queue.push(resolved);
        }
      }
    }
  }
  let current = path.resolve(cwd, to);
  while (current) {
    console.log(current);
    current = parent[current];
  }
}

async function main() {
  const { cwd, from, to } = await yargs
    .help(
      outdent`
        Logs the path to a certain file from a glob.
        This is useful if you want to investigate why a certain file is in the dependecy tree.
      `,
    )
    .option("cwd", {
      required: true,
      type: "string",
      description: "The working directory",
    })
    .option("from", {
      required: true,
      array: true,
      type: "string",
      description: "Origin file",
    })
    .option("to", {
      required: true,
      type: "string",
      description: "Destination file",
    }).argv;

  logPath(cwd, from, to);
}

run(main);
