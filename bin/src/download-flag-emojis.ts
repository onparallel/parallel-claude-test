import { run } from "./utils/run";
import fetch from "node-fetch";
import pMap from "p-map";
import yargs from "yargs";
import { writeFile } from "fs/promises";
import path from "path";
import { SingleBar, Presets } from "cli-progress";

async function main() {
  const { output } = await yargs.option("output", {
    required: true,
    type: "string",
    description: "Directory to place the images",
  }).argv;

  const res = await fetch(
    "https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/data/openmoji.json"
  );
  const data: any[] = await res.json();
  const flags = data.filter(
    (element: any) => element.group === "flags" && element.subgroups === "country-flag"
  );
  const bar = new SingleBar({}, Presets.shades_classic);
  bar.start(flags.length, 0);
  await pMap(
    flags,
    async (element) => {
      const match = element.tags.match(/^([A-Z]{2}),/);
      if (match?.[1]) {
        const code = match?.[1];
        const file = await fetch(
          `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/72x72/${element.hexcode}.png`
        );
        await writeFile(
          path.join(output, `${code.toLowerCase()}.png`),
          await file.buffer(),
          "binary"
        );
        bar.increment(1);
      }
    },
    { concurrency: 20 }
  );
  bar.stop();
}

run(main);
