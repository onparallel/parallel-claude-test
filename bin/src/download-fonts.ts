import { mkdir, rm } from "fs/promises";
import pMap from "p-map";
import { join } from "path";
import yargs from "yargs";
import { fetchToFile } from "./utils/fetchToFile";
import { writeJson } from "./utils/json";
import { run } from "./utils/run";

interface Font {
  family: string;
  files: Record<string, string>;
}

async function main() {
  const { outputManifest, fonts, output } = await yargs
    .option("fonts", {
      required: true,
      type: "string",
      array: true,
      description: "fonts to download",
    })
    .option("output", {
      required: true,
      type: "string",
      description: "Directory to place fonts",
    })
    .option("output-manifest", {
      required: true,
      type: "string",
      array: true,
      description: "where to put the manifest json file",
    }).argv;

  const res = await fetch(
    `https://webfonts.googleapis.com/v1/webfonts?${new URLSearchParams({
      fields: ["items.files", "items.family"].join(","),
      key: "AIzaSyBpQsEEScqktyrQeEGfm5R0UIMivXAlhw8",
    })}`,
  );
  const { items: availableFonts } = (await res.json()) as { items: Font[] };
  const results = [] as any[];
  await pMap(
    fonts,
    async (family) => {
      const [name, alias] = family.includes("@") ? family.split("@") : [family, family];
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
      const { files } = availableFonts.find((f) => f.family === name)!;
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
        const dest = join(familyDir, `${descriptor}.ttf`);
        await fetchToFile(url, dest);
      }
    },
    { concurrency: 1 },
  );
  for (const path of outputManifest) {
    await writeJson(path, results);
  }
}

run(main);
