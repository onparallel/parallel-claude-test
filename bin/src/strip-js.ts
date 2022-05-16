import { load } from "cheerio";
import { promises as fs } from "fs";
import yargs from "yargs";
import { run } from "./utils/run";

async function stripJs(input: string) {
  const file = await fs.readFile(input);
  const html = load(file);
  html("script").remove();
  html(`link[as="script"]`).remove();
  await fs.writeFile(input, html.html());
}

async function main() {
  const { input } = await yargs.option("input", {
    required: true,
    type: "string",
    description: "Files to strip js from",
  }).argv;
  await stripJs(input);
}

run(main);
