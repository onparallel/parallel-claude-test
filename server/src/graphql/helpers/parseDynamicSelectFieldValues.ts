export function parseDynamicSelectValues(data: string[][]) {
  const cleanedData = cleanData(data);
  validateData(cleanedData);
  const [labels, ...entries] = cleanedData;

  return { labels, values: parseEntries(entries) };
}

/** removes empty cells at the end of each row
 * and empty rows at the bottom.
 */
function cleanData(data: string[][]): string[][] {
  const partial = data.map((row) => {
    const realRowLength = row.reduce(
      (acc, cell) => (!!cell ? acc + 1 : acc),
      0
    );
    return row.slice(0, realRowLength);
  });

  const lastRowWithData = partial.reduce(
    (prevIndex, row, index) => (row.length > 0 ? index : prevIndex),
    -1
  );
  return partial.slice(0, lastRowWithData);
}

function validateData(data: string[][]) {
  if (
    data.some(
      (row) =>
        row.length < 2 ||
        row.length !== data[0].length ||
        row.some((cell) => !cell)
    )
  ) {
    throw new Error("INVALID_FORMAT_ERROR");
  }
}

function parseEntries(data: string[][]): any {
  // take each different entry in first column of data array
  const entries = Array.from(new Set(data.map((row) => row[0])));

  if (data[0].length > 1) {
    return entries.map((entry) => {
      // get every row in data containing `entry` in the first column
      // and remove that first col to recursively parse sub-entries
      const entryData = data
        .filter((row) => row[0] === entry)
        .map((row) => row.slice(1));
      return [entry, parseEntries(entryData)];
    });
  } else {
    return entries; // options in the last level
  }
}
