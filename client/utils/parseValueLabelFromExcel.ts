export async function parseValueLabelFromExcel(file: File) {
  const readXlsxFile = (await import("read-excel-file")).default;
  const rows = await readXlsxFile(file);
  const options = rows
    .slice(1)
    .map((row) => ({ value: row[0]?.toString(), label: row[1]?.toString() }));
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
