import { createWriteStream } from "fs";
import { Readable } from "stream";

export async function fetchToFile(
  input: string | URL | globalThis.Request,
  path: string,
): Promise<void>;
export async function fetchToFile(
  input: string | URL | globalThis.Request,
  init: RequestInit,
  path: string,
): Promise<void>;
export async function fetchToFile(
  input: string | URL | globalThis.Request,
  ...args: [init: RequestInit, path: string] | [path: string]
): Promise<void> {
  const [init, path] =
    typeof args[0] === "string" ? [{}, args[0]] : (args as [init: RequestInit, path: string]);
  const res = await fetch(input, init);
  if (res.ok) {
    return new Promise((resolve, reject) => {
      Readable.fromWeb(res.body! as any).pipe(
        createWriteStream(path).once("error", reject).once("close", resolve),
      );
    });
  } else {
    throw new Error("Error fetching resource");
  }
}
