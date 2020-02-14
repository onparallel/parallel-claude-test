import { promises as fs } from "fs";

export async function loadDoc(doc: string, locale: string) {
  try {
    return await fs.readFile(
      process.env.ROOT + `/docs/${doc}/${locale}.md`,
      "utf-8"
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      return await fs.readFile(
        process.env.ROOT + `/docs/${doc}/en.md`,
        "utf-8"
      );
    } else {
      throw error;
    }
  }
}
