import archiver from "archiver";
import { Readable } from "stream";

export type ZipFileInput = { filename: string; stream: Readable };

function eachSeries<T>(
  iterator: AsyncGenerator<T>,
  applyFn: (item: T, callback: (err?: Error) => void) => void,
  doneCb: (err?: Error) => void
) {
  function processNext({ done, value }: IteratorResult<T>) {
    if (done) return doneCb();
    applyFn(value, (err) => {
      if (err) return doneCb(err);
      iterator.next().then(processNext);
    });
  }

  iterator.next().then(processNext);
}

export function createZipFile(files: AsyncGenerator<ZipFileInput>) {
  const zip = archiver("zip");
  eachSeries(
    files,
    ({ filename, stream }, callback) => {
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
