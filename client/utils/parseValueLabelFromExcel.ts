import { parseExcel } from "./parseExcel";

export async function parseValueLabelFromExcel(file: File) {
  const options = await parseExcel(file, { columns: ["value", "label"] });
  // max of 1000 options
  if (options.length > 1000) {
    throw new Error("A maximum of 1000 options is allowed");
  }
  // all options with value
  if (options.some((x) => !x.value)) {
    throw new Error("All options must have a value");
  }
  // if any label is defined then all must be defined
  if (options.some((x) => x.label) && !options.every((x) => x.label)) {
    throw new Error("Either no labels or all options must have a label");
  }
  if (
    options.some((x) => (x.label && x.label.length > 2000) || (x.value && x.value.length > 2000))
  ) {
    throw new Error("Values and labels must be less than 2000 characters");
  }
  return {
    values: options.map((x) => x.value),
    labels: options.some((x) => x.label) ? options.map((x) => x.label) : null,
  };
}
