import { Font, renderToStream } from "@react-pdf/renderer";
import { execSync } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import { mkdir, rm, symlink, unlink, writeFile } from "fs/promises";
import hyphen from "hyphen";
import { tmpdir } from "os";
import pMap from "p-map";
import { resolve } from "path";
import { createElement } from "react";
import { IntlConfig, IntlProvider, createIntl } from "react-intl";
import { filter, forEach, groupBy, isNullish, mapValues, pipe, toPairs, unique } from "remeda";
import { Readable } from "stream";
import { assert } from "ts-essentials";
import { ContactLocale } from "../db/__types";
import { toBytes } from "../util/fileSize";
import { loadMessages } from "../util/loadMessages";
import { random } from "../util/token";
import fonts from "./utils/fonts.json";
import internationalFonts from "./utils/international_fonts.json";
import { PdfDocument, PdfDocumentGetPropsContext } from "./utils/pdf";

let hasInit = false;

function init() {
  const families = [...internationalFonts, ...fonts] as {
    family: string;
    fonts: { src: string; fontStyle: "italic"; fontWeight: number }[];
  }[];
  for (const f of families) {
    const fonts = f.fonts.map((font) => ({
      ...font,
      fontWeight: font.fontWeight ?? 400,
      src: `${process.env.ASSETS_URL!}/static/fonts/pdf/${encodeURIComponent(f.family)}/${
        font.src
      }`,
    }));
    Font.register({
      family: f.family,
      fonts: [
        ...fonts,
        // Add fallback for fonts with missing italic style
        ...(fonts.some((font) => font.fontStyle === "italic")
          ? []
          : [
              {
                ...fonts.find(
                  (font) =>
                    (font.fontStyle !== "italic" && font.fontWeight === undefined) ||
                    font.fontWeight === 400,
                )!,
                fontStyle: "italic",
              },
            ]),
      ],
    });
  }

  Font.registerEmojiSource({
    format: "png",
    url: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/",
  });
}

async function createHyphenationCallback(locale: ContactLocale) {
  let pattern;
  switch (locale) {
    case "en":
      pattern = await import("hyphen/patterns/en-us");
      break;
    case "es":
      pattern = await import("hyphen/patterns/es");
      break;
    case "it":
      pattern = await import("hyphen/patterns/it");
      break;
    case "pt":
      pattern = await import("hyphen/patterns/pt");
      break;
    case "ca":
      pattern = await import("hyphen/patterns/ca");
      break;
    default:
      pattern = null as never;
      break;
  }
  const SOFT_HYPHEN = "\u00ad";
  const hyphenator = hyphen(pattern);
  const splitHyphen = (word: string) => word.split(SOFT_HYPHEN);
  const cache = new Map<string, string[]>();

  return (word: string | null) => {
    if (isNullish(word)) {
      return [];
    }
    if (!cache.has(word)) {
      const splitted = word.includes(SOFT_HYPHEN)
        ? splitHyphen(word)
        : splitHyphen(hyphenator(word) as string);
      cache.set(word, splitted);
      return splitted;
    }
    return cache.get(word)!;
  };
}

interface PdfMetadataItem<TLabel extends string, TValue> {
  func: "metadata";
  label: `<${TLabel}>`;
  value: TValue;
}

export async function fetchToFile(
  url: string,
  path: string,
  options?: { maxFileSize?: number; fallbackUrl?: string },
): Promise<void> {
  try {
    console.log("Fetching...", url, JSON.stringify(options));
    if (options?.maxFileSize) {
      const { ok, headers } = await fetch(url, { method: "HEAD" });
      if (!ok) {
        throw new Error("Error fetching resource " + url);
      }
      const size = parseInt(headers.get("content-length") ?? "0");
      if (size > options.maxFileSize) {
        throw new Error("Resource is too big!");
      }
    }

    const res = await fetch(url);
    if (res.ok) {
      return new Promise((resolve, reject) => {
        Readable.fromWeb(res.body! as any).pipe(
          createWriteStream(path).once("error", reject).once("close", resolve),
        );
      });
    } else {
      throw new Error("Error fetching resource " + url);
    }
  } catch (error) {
    console.error("ERROR", error);
    if (options?.fallbackUrl) {
      console.log("Fetching fallback...", options.fallbackUrl);
      return await fetchToFile(options.fallbackUrl, path);
    } else {
      throw error;
    }
  }
}

export async function buildPdf<ID, P extends {}, M extends Record<string, any>>(
  document: PdfDocument<ID, P, M>,
  initial: ID,
  context: PdfDocumentGetPropsContext,
): Promise<{ stream: NodeJS.ReadableStream; metadata: { [K in keyof M]: M[K][] } }> {
  const messages = await loadMessages(context.locale);
  const props = document.getProps ? await document.getProps(initial, context) : initial;
  const intlProps: IntlConfig = {
    messages,
    locale: context.locale,
    defaultRichTextElements: {},
    onWarn: () => {},
  };
  if ("TYPST" in document && document.TYPST) {
    const content = document(props as any, createIntl(intlProps));
    const root = resolve(tmpdir(), random(16));
    await mkdir(`${root}/assets`, { recursive: true });
    const source = `${root}/document.typ`;
    const target = `${root}/document.pdf`;
    try {
      await writeFile(source, content);
      const metadata = JSON.parse(
        execSync(`typst query --input prequery-fallback=true ${source} 'metadata'`, {
          encoding: "utf-8",
        }),
      ) as PdfMetadataItem<string, any>[];
      await pMap(
        pipe(
          metadata,
          filter((p) => p.label === "<web-resource>"),
          groupBy((p) => p.value.url as string),
          mapValues((values) => unique(values.map((v) => v.value.path as string))),
          toPairs,
          forEach(([, paths]) => assert(paths.every((p) => p.startsWith("assets/")))),
        ),
        async ([url, paths]) => {
          const path = `${root}/${paths[0]}`;
          await fetchToFile(url, path, {
            maxFileSize: toBytes(10, "MB"),
            fallbackUrl: `${process.env.ASSETS_URL!}/static/images/pixel.png`,
          });

          try {
            execSync(`convert ${path} -resize 2000x2000\\> ${path}`);
          } catch (error) {
            console.log("Error resizing image", error);
            await fetchToFile(`${process.env.ASSETS_URL!}/static/images/pixel.png`, path);
          }

          for (const path of paths.slice(1)) {
            await symlink(`${root}/${paths[0]}`, `${root}/${path}`);
          }
        },
        { concurrency: 3 },
      );
      execSync(
        `typst compile ${source} ${target} --font-path ${resolve(process.cwd(), "../client/public/static/fonts/pdf")}`,
      );
      const stream = createReadStream(target);
      stream.on("close", () => {
        rm(root, { recursive: true, force: true }).then();
      });
      return {
        stream,
        metadata: pipe(
          metadata,
          filter((p) => p.label !== "<web-resource>"),
          groupBy((p) => p.label.slice(1, -1)),
          mapValues((values) => values.map((v) => v.value)),
        ) as any,
      };
    } finally {
      await rm(`${root}/assets`, { recursive: true, force: true });
      await unlink(source);
    }
  } else {
    if (!hasInit) {
      init();
      hasInit = true;
    }
    Font.registerHyphenationCallback(await createHyphenationCallback(context.locale ?? "en"));
    return {
      stream: await renderToStream(
        <IntlProvider {...intlProps}>{createElement<P>(document, props as any)}</IntlProvider>,
      ),
      metadata: {} as any,
    };
  }
}
