import { PetitionField } from "@parallel/graphql/__types";
import { useMemo } from "react";

export type PetitionFieldIndex = number | string;

/**
 * Generates and increasing sequence of letter indices (same as Excel columns)
 * A, B, ... Z, AA, AB, ... AZ, BA ... ZZ, AAA, AAB, ...
 */
function* letters() {
  const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  let counter = 0;
  while (true) {
    let remaining = counter;
    let result = "";
    while (remaining >= 0) {
      result = symbols[remaining % symbols.length] + result;
      remaining = Math.floor(remaining / symbols.length) - 1;
    }
    yield result;
    counter++;
  }
}

/**
 * Generates an increasing sequence of numbers
 */
function* numbers() {
  let counter = 0;
  while (true) {
    yield counter + 1;
    counter++;
  }
}

export function getFieldIndices(
  fields: Pick<PetitionField, "type">[]
): PetitionFieldIndex[] {
  const letter = letters();
  const number = numbers();
  return fields.map((f) =>
    f.type === "HEADING"
      ? (letter.next().value as string)
      : (number.next().value as number)
  );
}
/**
 * iterates every field and returns an array representing the index of each one in the same order
 * @param fields fields to iterate.
 */
export function useFieldIndices(
  fields: Pick<PetitionField, "type">[]
): PetitionFieldIndex[] {
  return useMemo(() => getFieldIndices(fields), [
    fields.map((f) => f.type).join(","),
  ]);
}
