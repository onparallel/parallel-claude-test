import { PetitionField } from "@parallel/graphql/__types";
import { useMemo } from "react";

function numberToBase26(number: number, tail = ""): string {
  if (number <= 26) {
    return `${String.fromCharCode(number + 64)}${tail}`;
  }

  const remainder = number % 26 || 26;
  const division = Math.trunc(number / 26) - (remainder === 26 ? 1 : 0);

  return numberToBase26(
    division,
    `${String.fromCharCode(remainder + 64)}${tail}`
  );
}

function nextLetter(symbols: Array<string | number>) {
  const index = symbols.filter((s) => typeof s === "string").length;
  return numberToBase26(index + 1);
}

function nextNumber(symbols: Array<string | number>) {
  const index = symbols.filter((s) => typeof s === "number").length;
  return index + 1;
}

export function getFieldIndexValues(fields: Pick<PetitionField, "type">[]) {
  return useMemo(() => {
    return fields.reduce<Array<string | number>>((partial, field) => {
      if (field.type === "HEADING") {
        return partial.concat(nextLetter(partial));
      } else {
        return partial.concat(nextNumber(partial));
      }
    }, []);
  }, [fields, nextLetter, nextNumber]);
}
