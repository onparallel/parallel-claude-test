import archiver from "archiver";
import { eachSeries } from "async";
import { Readable } from "stream";

export type ZipFileInput = { filename: string; stream: Readable };

export function createZipFile(
  files: IterableIterator<ZipFileInput> | AsyncIterableIterator<ZipFileInput>
) {
  const zip = archiver("zip");
  eachSeries(
    files as any, // type definitions are outdated
    ({ filename, stream }: ZipFileInput, callback) => {
      stream.on("end", callback);
      stream.on("error", callback);
      zip.append(stream, { name: filename });
    },
    (err) => {
      if (err) {
        zip.emit("error", err);
      } else {
        zip.finalize();
      }
    }
  );
  return zip;
}
