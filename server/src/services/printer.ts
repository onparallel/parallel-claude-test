import { injectable } from "inversify";
import { chromium } from "playwright";

type PdfPrintOptions = {
  path?: string;
};

export interface IPrinter {
  pdf(url: string, opts?: PdfPrintOptions): Promise<Buffer>;
}

export const PRINTER = Symbol.for("PRINTER");

@injectable()
export class Printer implements IPrinter {
  public async pdf(url: string, opts?: PdfPrintOptions): Promise<Buffer> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "screen" });
    const buffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      ...opts,
    });
    await browser.close();
    return buffer;
  }
}
