import { range, takeWhile } from "remeda";

export function parseDynamicSelectValues(data: string[][]) {
  const [labels, ...entries] = cleanAndValidate(data);
  return { labels, values: parseEntries(entries) };
}

/**
 * removes empty cells at the end of each row and empty rows at the bottom.
 */
function cleanAndValidate(data: string[][]): string[][] {
  const headers = takeWhile(data[0], (cell) => !!cell);
  if (headers.length < 2) {
    throw new Error("Not enough columns");
  }
  const rows = [headers];
  for (let r = 1; r < data.length; r++) {
    const row = data[r].slice(0, headers.length);
    if (row.every((c) => !c)) {
      continue;
    }
    const missing = row.findIndex((c) => !c);
    if (missing !== -1) {
      throw new Error(`Missing value at (${r}, ${missing})`);
    }
    rows.push(row);
  }
  return rows;
}

export type DynamicSelectOption = [string, Array<DynamicSelectOption | string>];

function parseEntries(
  data: string[][],
  column = 0,
  start = 0,
  end = data.length
): DynamicSelectOption[] {
  const entries: DynamicSelectOption[] = [];
  let [currentStart, current] = [start, data[start][column]];
  for (let i = start + 1; i < end; ++i) {
    if (data[i][column] !== current) {
      addEntry(current, currentStart, i);
      [currentStart, current] = [i, data[i][column]];
    }
  }
  addEntry(current, currentStart, end);

  function addEntry(value: string, start: number, end: number) {
    entries.push([
      value,
      column === data[start].length - 2
        ? range(start, end).map((row) => data[row][column + 1])
        : parseEntries(data, column + 1, start, end),
    ]);
  }

  return entries;
}
