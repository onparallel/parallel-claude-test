import { execSync } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import { copyFile, mkdir, rm, stat, symlink, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import pMap from "p-map";
import { resolve } from "path";
import { IntlConfig, createIntl } from "react-intl";
import { entries, filter, forEach, groupBy, mapValues, pipe, unique } from "remeda";
import { Readable } from "stream";
import { assert } from "ts-essentials";
import { toBytes } from "../util/fileSize";
import { loadMessages } from "../util/loadMessages";
import { random } from "../util/token";
import { PdfDocument, PdfDocumentGetPropsContext } from "./utils/pdf";

interface PdfMetadataItem<TLabel extends string, TValue> {
  func: "metadata";
  label: `<${TLabel}>`;
  value: TValue;
}

async function fetchToFile(
  pathOrUrl: string,
  path: string,
  options?: { maxFileSize?: number; fallbackUrl?: string },
): Promise<void> {
  console.log("Fetching...", pathOrUrl, JSON.stringify(options));

  try {
    if (pathOrUrl.startsWith("/")) {
      // It's a local file, copy it directly
      await stat(pathOrUrl);
      await copyFile(pathOrUrl, path);
    } else {
      const url = pathOrUrl;
      if (options?.maxFileSize) {
        const { ok, headers } = await fetch(url, {
          // to check file size, we will do a fetch of only the first byte
          // and check content-range header to get the full size
          // method: "HEAD" does not work if the URL is a signed download URL from S3
          // as those URLs only accept GET requests
          headers: { Range: "bytes=0-0" },
        });

        if (!ok) {
          throw new Error("Error fetching resource " + url);
        }

        // if "Content-Range: bytes 0-0/1000"
        // total file size will be 1000 bytes
        const size = parseInt(headers.get("content-range")?.split("/")?.[1] ?? "0");
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
): Promise<{ stream: Readable; metadata: { [K in keyof M]: M[K][] } }> {
  const messages = await loadMessages(context.locale);
  const props = document.getProps ? await document.getProps(initial, context) : initial;
  const intlProps: IntlConfig = {
    messages,
    locale: context.locale,
    defaultRichTextElements: {},
    onWarn: () => {},
  };
  // All documents now use Typst
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
        entries(),
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
}
