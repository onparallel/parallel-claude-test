import archiver from "archiver";
import { PassThrough, pipeline, Readable } from "stream";

interface ZipFileInput {
  filename: string;
  getStream: () => Promise<Readable>;
}

export function createZipFile(
  files: ZipFileInput[],
  options?: { onProgress?: (processed: number, totalCount: number) => void },
) {
  const zip = archiver("zip");

  const totalCount = files.length;
  let progress = 0;
  async function processFile(file: ZipFileInput | undefined) {
    if (!file) {
      zip.finalize();
    } else {
      const { getStream, filename } = file;
      const stream = await getStream();
      stream.on("end", () => {
        options?.onProgress?.(++progress, totalCount);
        processFile(files.pop());
      });
      stream.on("error", (err) => zip.emit("error", err));
      zip.append(stream, { name: filename });
    }
  }

  processFile(files.pop());

  // workaround until this is fixed https://github.com/aws/aws-sdk-js-v3/issues/2522
  const passThrough = new PassThrough();
  return pipeline(zip, passThrough, () => {}) as Readable;
}
