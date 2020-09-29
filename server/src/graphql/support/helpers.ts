import { createWriteStream, ReadStream } from "fs";
import { join } from "path";

export type File = {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => ReadStream;
};

type Options = {
  dir: string;
};

export async function writeFile(
  file: File,
  options?: Options
): Promise<string> {
  const filePath = join(options?.dir || "", file.filename);
  return new Promise((resolve, reject) => {
    file
      .createReadStream()
      .on("error", (err: any) => {
        reject(err);
      })
      .on("end", () => {
        resolve(filePath);
      })
      .pipe(createWriteStream(filePath));
  });
}
