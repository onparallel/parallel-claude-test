import { useState } from "react";
import { DynamicSelectOption } from "../petitionFields";

export function useDynamicSelectValues() {
  const [labels, setLabels] = useState<string[] | null>(null);
  const [values, setValues] = useState<DynamicSelectOption[] | null>(null);

  return {
    labels,
    values,
    parseValues: (data: string[][]) => {
      const cleanedData = cleanData(data);
      validateData(cleanedData);
      const [headers, ...entries] = cleanedData;
      setLabels(headers);
      setValues(parseEntries(entries));
    },
  };
}

/** removes empty cells at the end of each row */
function cleanData(data: string[][]): string[][] {
  return data.map((row) => {
    const realRowLength = row.reduce(
      (acc, cell) => (!!cell ? acc + 1 : acc),
      0
    );
    return row.slice(0, realRowLength);
  });
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

function parseEntries(data: string[][]): DynamicSelectOption[] {
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
    return entries as any; // options in the last level
  }
}
