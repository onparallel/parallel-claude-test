import { injectable } from "inversify";
import { chromium } from "playwright";

type PdfPrintOptions = {
  path?: string;
  height?: string;
  width?: string;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
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

    const isProduction = process.env.NODE_ENV === "production";
    // on develop the 'networkidle' event is not triggered, because of webpack doing regular polls
    const waitUntil = isProduction ? "networkidle" : "load";
    await page.goto(url, { waitUntil });

    const buffer = await page.pdf({
      printBackground: true,
      displayHeaderFooter: false,
      ...opts,
    });
    await browser.close();
    return buffer;
  }
}
