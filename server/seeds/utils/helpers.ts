import { CreateStandardListDefinition, StandardListDefinitionListType } from "../../src/db/__types";

function validateDateFormat(value: any): {
  day?: "numeric" | "2-digit";
  month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
  year?: "numeric" | "2-digit";
} {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid date format: must be an object");
  }

  // Check for invalid properties
  const allowedProps = ["day", "month", "year"];
  const invalidProps = Object.keys(value).filter((prop) => !allowedProps.includes(prop));
  if (invalidProps.length > 0) {
    throw new Error(`Invalid date format: unknown properties [${invalidProps.join(", ")}]`);
  }

  // Validate day format
  if ("day" in value && !["numeric", "2-digit"].includes(value.day)) {
    throw new Error('Invalid date format: day must be "numeric", or "2-digit"');
  }

  // Validate month format
  if (
    "month" in value &&
    !["numeric", "2-digit", "long", "short", "narrow"].includes(value.month)
  ) {
    throw new Error(
      'Invalid date format: month must be "numeric", "2-digit", "long", "short", or "narrow"',
    );
  }

  // Validate year format
  if ("year" in value && !["numeric", "2-digit"].includes(value.year)) {
    throw new Error('Invalid date format: year must be "numeric", or "2-digit"');
  }

  return value;
}

export function parseStandardListDefinitionsData(data: string[][]) {
  [
    "Unique ID",
    "List Type",
    "Name EN",
    "Name ES",
    "Source",
    "Source URL",
    "Version",
    "Version Format",
    "Version URL",
    "List (VALUE|SUFFIX|PREFIX)",
  ].forEach((key, i) => {
    if (data[i][0] !== key) {
      throw new Error(`Invalid header at row ${i + 1}. Expected ${key}, got ${data[i][0]}`);
    }
  });

  const listCount = data[0].length - 1; // subtract headings column

  const lists: CreateStandardListDefinition[] = [];
  for (let i = 0; i < listCount; i++) {
    const versionFormat = validateDateFormat(JSON.parse(data[7][i + 1]));
    const list: CreateStandardListDefinition = {
      list_name: data[0][i + 1],
      list_type: data[1][i + 1] as StandardListDefinitionListType,
      title: { en: data[2][i + 1], es: data[3][i + 1] },
      source_name: data[4][i + 1],
      source_url: data[5][i + 1],
      list_version: data[6][i + 1],
      version_format: versionFormat,
      version_url: data[8][i + 1],
      values: [],
    };

    for (let j = 9; !!data[j]?.[i + 1]; j++) {
      const [key, suffix, prefix] = data[j][i + 1].split("|");
      list.values.push({
        key,
        ...(suffix ? { suffix } : {}),
        ...(prefix ? { prefix } : {}),
      });
    }

    lists.push(list);
  }

  return lists.filter((list) => list.list_name !== ""); // filter empty cells
}
