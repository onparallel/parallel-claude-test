import { existsSync } from "fs";
import { join } from "path";
import sanitize from "sanitize-filename";
import { assert } from "ts-essentials";

export async function getAvailableFileName(directory: string, filename: string, extension: string) {
  assert(extension.startsWith("."), "extension must include initial .");
  const sanitized = sanitize(filename).slice(0, 255 - extension.length);
  const path = join(directory, sanitized + extension);
  if (!existsSync(path)) {
    return path;
  }
  let counter = 1;
  while (counter < 100) {
    const prefix = ` (${counter++})`;
    const sanitized = sanitize(filename).slice(0, 255 - extension.length - prefix.length);
    const path = join(directory, sanitized + prefix + extension);
    if (!existsSync(path)) {
      return path;
    }
  }
  throw new Error("Can't create filename");
}
