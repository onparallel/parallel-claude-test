// @vitest-environment node
import { readFileSync } from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { checkPdfPassword } from "../checkPdfPassword";

function loadFixture(name: string) {
  const buffer = readFileSync(new URL(`./fixtures/${name}`, import.meta.url));
  return new Blob([new Uint8Array(buffer)], { type: "application/pdf" });
}

describe("checkPdfPassword", () => {
  it("returns true for an unprotected PDF", async () => {
    const file = loadFixture("simple.pdf");
    const result = await checkPdfPassword(pdfjs, file, undefined);
    expect(result).toBe(true);
  });

  it("returns false for a password-protected PDF without providing a password", async () => {
    const file = loadFixture("protected.pdf");
    const result = await checkPdfPassword(pdfjs, file, undefined);
    expect(result).toBe(false);
  });

  it("returns true for a password-protected PDF with the correct password", async () => {
    const file = loadFixture("protected.pdf");
    const result = await checkPdfPassword(pdfjs, file, "test123");
    expect(result).toBe(true);
  });

  it("returns false for a password-protected PDF with a wrong password", async () => {
    const file = loadFixture("protected.pdf");
    const result = await checkPdfPassword(pdfjs, file, "wrong");
    expect(result).toBe(false);
  });
});
