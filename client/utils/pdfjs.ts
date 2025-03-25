export type PdfJs = Awaited<typeof import("pdfjs-dist")>;

export async function loadPdfJs(): Promise<PdfJs> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc =
    `/pdf.worker` + process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
      ? ".mjs"
      : `.${process.env.NEXT_PUBLIC_ENVIRONMENT}.mjs`;
  return pdfjs;
}
