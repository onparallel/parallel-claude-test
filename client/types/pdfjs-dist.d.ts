declare module "pdfjs-dist/build/pdf.worker.min.mjs" {
  export default function (target: string, pattern?: string): boolean;
}

declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export * from "pdfjs-dist";
}
