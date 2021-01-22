import archiver from "archiver";
import { Readable } from "stream";

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
  return zip;
}
