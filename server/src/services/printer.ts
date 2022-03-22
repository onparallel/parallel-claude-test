import { injectable } from "inversify";
import { chromium } from "playwright";

export interface IPrinter {
  pdf(url: string, path?: string): Promise<Buffer>;
}

export const PRINTER = Symbol.for("PRINTER");

@injectable()
export class Printer implements IPrinter {
  public async pdf(url: string, path?: string): Promise<Buffer> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "load" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      path,
    });
    await browser.close();
    return buffer;
  }
}
