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

/**
 * searches for the last string type value in the symbols array and returns the next one
 * example: nextLetter(["A", 1, 2, "B", 3]) === "C"
 */
function nextLetter(symbols: Array<string | number>) {
  const index = symbols.filter((s) => typeof s === "string").length;
  return numberToBase26(index + 1);
}

/**
 * searches for the last number type value in the symbols array and returns the next one
 * example: nextNumber(["A", 1, 2, "B", 3]) === 4
 */
function nextNumber(symbols: Array<string | number>) {
  const index = symbols.filter((s) => typeof s === "number").length;
  return index + 1;
}

/**
 * iterates every field and returns an array representing the index of each one in the same order
 * @param fields fields to iterate.
 */
export function useFieldIndexValues(fields: Pick<PetitionField, "type">[]) {
  return useMemo(() => {
    return fields.reduce<Array<string | number>>((values, field) => {
      if (field.type === "HEADING") {
        // concat the next letter in alphabet that is not already included in the array
        return values.concat(nextLetter(values));
      } else {
        // concat the next number that is not already included in the array
        return values.concat(nextNumber(values));
      }
    }, []);
  }, [fields, nextLetter, nextNumber]);
}
