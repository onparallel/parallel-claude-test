import archiver from "archiver";
import { Readable } from "stream";

export type ZipFileInput = { filename: string; stream: Readable };

export async function createZipFile(files: AsyncGenerator<ZipFileInput>) {
  const zip = archiver("zip");

  let iterator: IteratorResult<ZipFileInput>;
  while (!(iterator = await files.next()).done) {
    try {
      await new Promise((resolve, reject) => {
        const { stream, filename } = iterator.value;
        stream.on("end", resolve);
        stream.on("error", reject);
        zip.append(stream, { name: filename });
      });
    } catch (e) {
      zip.emit("error", e);
    }
  }
  await zip.finalize();
  return zip;
}
