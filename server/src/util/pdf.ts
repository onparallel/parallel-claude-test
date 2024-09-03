import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { resolve } from "path";
import { Readable } from "stream";
import { ChildProcessNonSuccessError, spawn } from "./spawn";
import { random } from "./token";

/**
 * Removes password from a PDF file.
 * The original file is not modified, the decrypted file is written into a temporary directory.
 *
 * Throws an error if the password is incorrect.
 *
 * @param file - PDF file with password
 * @param password - Password to remove
 * @returns Path to the decrypted PDF file
 */
export async function removePasswordFromPdf(file: Readable, password: string) {
  // need to write file into a temporary to be able to process it with qpdf
  const temporaryFilePath = resolve(tmpdir(), random(10));
  await writeFile(temporaryFilePath, file);

  // overwrite file with the decrypted one
  try {
    await spawn(
      "qpdf",
      ["--no-warn", "--decrypt", "--password=" + password, "--replace-input", temporaryFilePath],
      {
        timeout: 30_000, // 30 seconds
      },
    );
  } catch (error) {
    if (error instanceof ChildProcessNonSuccessError && error.exitCode === 3) {
      // qpdf exited with warnings, its OK
    } else {
      throw error;
    }
  }

  return temporaryFilePath;
}
