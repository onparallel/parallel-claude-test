import { createWriteStream } from "fs";
import { mkdir, rm } from "fs/promises";
import fetch from "node-fetch";
import pMap from "p-map";
import { join } from "path";
import yargs from "yargs";
import { writeJson } from "./utils/json";
import { run } from "./utils/run";

const SELECTION: (string | [name: string, alias: string])[] = [
  "IBM Plex Sans",
  "Roboto Slab",
  "Merriweather",
  "Playfair Display",
  "Lora",
  "PT Serif",
  ["Source Serif 4", "Source Serif Pro"],
  "IBM Plex Serif",
  "Cormorant Garamond",
  "Alegreya",
  "Tinos",
  "Libre Baskerville",
  "Noto Serif",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  ["Source Sans 3", "Source Sans Pro"],
  "Noto Sans",
  "Raleway",
  "Nunito",
  "Rubik",
  "Parisienne",
  "Rubik Wet Paint",
  "Inconsolata",
];

interface Font {
  family: string;
  files: Record<string, string>;
}

async function main() {
  const { output } = await yargs.option("output", {
    required: true,
    type: "string",
    description: "Directory to place fonts",
  }).argv;

  const res = await fetch(
    `https://webfonts.googleapis.com/v1/webfonts?${new URLSearchParams({
      fields: ["items.files", "items.family"].join(","),
      key: "AIzaSyBpQsEEScqktyrQeEGfm5R0UIMivXAlhw8",
    })}`,
  );
  const { items: fonts } = (await res.json()) as { items: Font[] };
  const results = [] as any[];
  await pMap(
    SELECTION,
    async (family) => {
      const [name, alias] = Array.isArray(family) ? family : [family, family];
      const familyDir = join(output, alias);
      const result = {
        family: alias,
        fonts: [] as any[],
      };
      results.push(result);
      try {
        await rm(familyDir, { recursive: true });
      } catch {}
      await mkdir(familyDir);
      console.log(`Downloading ${name}`);
      const { files } = fonts.find((f) => f.family === name)!;
      for (const [descriptor, url] of Object.entries(files)) {
        const sourceUrl = `${descriptor}.ttf`;
        if (descriptor === "regular") {
          result.fonts.push({ src: sourceUrl });
        } else if (descriptor === "italic") {
          result.fonts.push({
            src: sourceUrl,
            fontStyle: "italic",
          });
        } else {
          const match = descriptor.match(/^(\d{3})(italic)?$/);
          if (match) {
            const [_, fontWeight, italic] = match;
            result.fonts.push({
              src: sourceUrl,
              fontStyle: italic,
              fontWeight: parseInt(fontWeight),
            });
          }
        }
        const res = await fetch(url);
        const dest = join(familyDir, `${descriptor}.ttf`);
        await new Promise((resolve, reject) =>
          res.body.pipe(createWriteStream(dest)).on("error", reject).on("close", resolve),
        );
      }
    },
    {
      concurrency: 1,
    },
  );
  await writeJson(join(output, "fonts.json"), results);
}

run(main);
