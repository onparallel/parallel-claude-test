import { parseExcel } from "./parseExcel";

export async function parseProfileSelectOptionsFromExcel(file: File) {
  return (await parseExcel(file, { columns: ["value", "label_en", "label_es"] })).map((x) => ({
    value: x.value,
    label: { en: x.label_en, es: x.label_es },
  }));
}
