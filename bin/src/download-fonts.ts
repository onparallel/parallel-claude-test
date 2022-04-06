import fetch from "node-fetch";
import { run } from "./utils/run";
import pMap from "p-map";
import yargs from "yargs";
import { tmpdir } from "os";
import { mkdir, rm } from "fs/promises";
import { createWriteStream } from "fs";
import { join } from "path";
import { token } from "./utils/token";
import { execSync } from "child_process";
import { writeJson } from "./utils/json";

const SELECTION = [
  "IBM Plex Sans",
  "Roboto Slab",
  "Merriweather",
  "Playfair Display",
  "Lora",
  "PT Serif",
  "Source Serif Pro",
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
  "Source Sans Pro",
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
    })}`
  );
  const { items: fonts } = (await res.json()) as { items: Font[] };
  const dir = join(tmpdir(), `download-fonts-${token(16)}`);
  await mkdir(dir);
  const results = [] as any[];
  await pMap(
    SELECTION,
    async (family) => {
      const familyDir = join(output, family);
      const result = {
        family,
        fonts: [] as any[],
      };
      results.push(result);
      try {
        await rm(familyDir, { recursive: true });
      } catch {}
      await mkdir(familyDir);
      const { files } = fonts.find((f) => f.family === family)!;
      console.log(`Transforming ${family}`);
      for (const [descriptor, url] of Object.entries(files)) {
        const sourceUrl = `URL/${encodeURIComponent(family)}/${descriptor}.ttf`;
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
        const name = token(16);
        const path = join(dir, `${name}.ttf`);
        await new Promise((resolve, reject) =>
          res.body.pipe(createWriteStream(path)).on("error", reject).on("close", resolve)
        );
        const dest = join(familyDir, `${descriptor}.ttf`);
        execSync(`fontforge -lang=ff -c 'Open($1); Generate($2); Close();' '${path}' '${dest}'`);
      }
    },
    {
      concurrency: 1,
    }
  );
  await writeJson(join(output, "fonts.json"), results);
  await rm(dir, { recursive: true });
}

run(main);
