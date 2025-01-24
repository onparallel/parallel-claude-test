export type PdfJs = Awaited<typeof import("pdfjs-dist")>;

export async function loadPdfJs(): Promise<PdfJs> {
  const pdfjs = await import("pdfjs-dist");
  // copy from ../node_modules/pdfjs-dist/legacy/build/
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker${process.env.NEXT_PUBLIC_ENVIRONMENT === "staging" ? ".staging" : ""}.mjs`;

  return pdfjs;
}
