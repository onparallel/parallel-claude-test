import type { PdfJs } from "./pdfjs";

export async function checkPdfPassword(pdfjs: PdfJs, file: Blob, password: string | undefined) {
  return new Promise<boolean>(async (resolve, reject) => {
    const task = pdfjs.getDocument({ data: await file.arrayBuffer(), password });
    task.onPassword = () => {
      resolve(false);
    };
    task.promise.then(() => resolve(true), reject);
  });
}
