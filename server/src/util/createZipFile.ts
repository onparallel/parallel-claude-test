import archiver from "archiver";
import { PassThrough, pipeline, Readable } from "stream";

export type ZipFileInput = { filename: string; stream: Readable };

export function createZipFile(files: AsyncGenerator<ZipFileInput>) {
  const zip = archiver("zip");
  function processFile(result: IteratorResult<ZipFileInput>) {
    if (result.done) {
      zip.finalize();
    } else {
      const { stream, filename } = result.value;
      stream.on("end", () => files.next().then(processFile));
      stream.on("error", (err) => zip.emit("error", err));
      zip.append(stream, { name: filename });
    }
  }
  files.next().then(processFile);
  // workaround until this is fixed https://github.com/aws/aws-sdk-js-v3/issues/2522
  const passThrough = new PassThrough();
  return pipeline(zip, passThrough, () => {}) as Readable;
}
