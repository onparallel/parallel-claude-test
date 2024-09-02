import { Presets, SingleBar } from "cli-progress";
import pMap from "p-map";
import path from "path";
import yargs from "yargs";
import { fetchToFile } from "./utils/fetchToFile";
import { run } from "./utils/run";

async function main() {
  const { output } = await yargs.option("output", {
    required: true,
    type: "string",
    description: "Directory to place the images",
  }).argv;

  const res = await fetch(
    "https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/data/openmoji.json",
  );
  const data: any[] = await res.json();
  const flags = data.filter(
    (element: any) => element.group === "flags" && element.subgroups === "country-flag",
  );
  const bar = new SingleBar({}, Presets.shades_classic);
  bar.start(flags.length, 0);
  await pMap(
    flags,
    async (element) => {
      const match = element.tags.match(/^([A-Z]{2}),/);
      if (match?.[1]) {
        const code = match?.[1];
        const url = `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/72x72/${element.hexcode}.png`;
        await fetchToFile(url, path.join(output, `${code.toLowerCase()}.png`));
        bar.increment(1);
      }
    },
    { concurrency: 20 },
  );
  bar.stop();
}

run(main);
