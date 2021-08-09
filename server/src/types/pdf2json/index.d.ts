declare module "pdf2json" {
  export = class PDFParser {
    parseBuffer(buff: Buffer): void;
    on(event: "pdfParser_dataReady" | "pdfParser_dataError", callback: (data: any) => void);
  };
}
