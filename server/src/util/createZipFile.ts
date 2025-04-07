import archiver from "archiver";
import { createReadStream, createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import PQueue from "p-queue";
import path from "path";
import { PassThrough, pipeline, Readable } from "stream";
import { promisify } from "util";
import { constants } from "zlib";

interface ZipFileInput {
  filename: string;
  getStream: () => Promise<Readable>;
}

const pipelineAsync = promisify(pipeline);

export function createZipFile(
  tempRoot: string,
  files: ZipFileInput[],
  options?: { onProgress?: (processed: number, totalCount: number) => void },
): Readable {
  const zip = archiver("zip", { zlib: { level: constants.Z_BEST_SPEED } });
  // zip 1 file at a time
  // first file is processed right away from the download stream
  // the rest go through the file system to speed up the process as they can be downloaded while
  // previous files are being zipped
  const zipQueue = new PQueue({ concurrency: 1 });
  const queue = new PQueue({ concurrency: 4 });
  let progress = 0;
  (async () => {
    try {
      await queue.addAll(
        files.map((file, i) => async () => {
          if (i < 1) {
            await zipQueue.add(() => processFile(file));
          } else {
            const { getStream, filename } = file;
            const stream = await getStream();
            const tempPath = path.resolve(tempRoot, `${i}`);
            const filePath = path.resolve(tempPath, filename);
            await mkdir(tempPath, { recursive: true });
            await pipelineAsync(stream, createWriteStream(filePath));
            await zipQueue.add(() =>
              processFile({
                getStream: async () => createReadStream(filePath),
                filename,
              }),
            );
          }
          options?.onProgress?.(++progress, files.length);
        }),
        {},
      );
      await zip.finalize();
    } catch (err) {
      zip.emit("error", err);
    }
  })().then();

  async function processFile(file: ZipFileInput) {
    const { getStream, filename } = file;
    const stream = await getStream();
    return await new Promise<void>((resolve, reject) => {
      stream.on("end", () => resolve());
      stream.on("error", (err) => reject(err));
      zip.append(stream, { name: filename });
    });
  }

  return pipeline(zip, new PassThrough(), () => {}) as Readable;
}
