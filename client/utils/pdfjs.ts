export type PdfJs = Awaited<typeof import("pdfjs-dist")>;

export async function loadPdfJs(): Promise<PdfJs> {
  const pdfjs = await import("pdfjs-dist");
  // copy from ../node_modules/pdfjs-dist/legacy/build/
  pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/js/pdf.worker.min.mjs`;

  return pdfjs;
}
