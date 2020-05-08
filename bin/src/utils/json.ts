import { promises as fs } from "fs";

export async function readJson<T = any>(path: string): Promise<T> {
  const contents = await fs.readFile(path, "utf-8");
  return JSON.parse(contents);
}

interface WriteJsonOpts {
  pretty?: boolean;
}

export async function writeJson(
  path: string,
  contents: any,
  opts?: WriteJsonOpts
) {
  const { pretty } = { pretty: false, ...opts };
  await fs.writeFile(
    path,
    (pretty ? JSON.stringify(contents, null, "  ") : JSON.stringify(contents)) +
      "\n",
    "utf-8"
  );
}
