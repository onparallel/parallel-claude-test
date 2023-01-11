import { Page } from "@playwright/test";
import { readFile } from "fs/promises";
import { join } from "path";

export async function createDataTransfer(
  page: Page,
  { filePath, fileName, fileType }: { filePath: string; fileName: string; fileType: string }
) {
  const buffer = await readFile(join(__dirname, filePath));
  return await page.evaluateHandle(
    ([buffer, fileName, fileType]) => {
      const dt = new DataTransfer();
      // Convert the buffer to a hex array
      const file = new File([buffer.toString("hex")], fileName, { type: fileType });
      dt.items.add(file);
      return dt;
    },
    [buffer, fileName, fileType] as [Buffer, string, string]
  );
}
