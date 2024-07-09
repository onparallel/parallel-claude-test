import { listTimeZones } from "timezone-support";
import yargs from "yargs";
import { writeJson } from "./utils/json";
import { run } from "./utils/run";

async function main() {
  const { output } = await yargs.option("output", {
    required: true,
    type: "string",
    description: "Directory to place JSON list",
  }).argv;

  await writeJson(output, listTimeZones());
}

run(main);
