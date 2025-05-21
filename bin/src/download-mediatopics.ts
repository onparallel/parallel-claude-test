import yargs from "yargs";
import { writeJson } from "./utils/json";
import { run } from "./utils/run";

async function main() {
  const { output } = await yargs.option("output", {
    required: true,
    type: "string",
    description: "Directory to place the data",
  }).argv;

  async function getData() {
    const data = await (await fetch("https://cv.iptc.org/newscodes/mediatopic?format=json")).json();

    return {
      conceptSet: data.conceptSet.map((c: any) => ({
        qcode: c.qcode,
        narrower: c.narrower,
      })),
    };
  }

  await writeJson(output, await getData());
}

run(main);
