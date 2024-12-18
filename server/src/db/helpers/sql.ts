import { Knex } from "knex";
import { isNonNullish, times } from "remeda";

export function sqlIn(knex: Knex, array: readonly Knex.RawBinding[], castAs?: string) {
  const q = isNonNullish(castAs) ? `?::${castAs}` : "?";
  if (array.length === 0) {
    throw new Error("array can't be empty");
  }
  return knex.raw(/* sql */ `(${array.map(() => q).join(", ")})`, [...array]);
}

export function sqlArray(knex: Knex, array: readonly Knex.RawBinding[], castAs?: string) {
  const q = isNonNullish(castAs) ? `?::${castAs}` : "?";
  return knex.raw(/* sql */ `array[${array.map(() => q).join(", ")}]`, [...array]);
}

export function sqlValues(knex: Knex, tuples: readonly Knex.RawBinding[][], castAs?: string[]) {
  if (process.env.NODE_ENV !== "production" && isNonNullish(castAs)) {
    if (!tuples.every((tuple) => tuple.length === castAs.length)) {
      throw new Error("All tuples must have the same length as the castAs parameter");
    }
  }
  if (tuples.length === 0) {
    throw new Error("array can't be empty");
  }
  const tupleLength = tuples[0].length;
  if (process.env.NODE_ENV !== "production") {
    if (tuples.some((t) => t.length !== tupleLength)) {
      throw new Error("All tuples must have the same length as the castAs parameter");
    }
  }
  const q = isNonNullish(castAs)
    ? `(${castAs.map((element) => `?::${element}`).join(", ")})`
    : `(${times(tupleLength, () => "?").join(", ")})`;
  return knex.raw(/* sql */ `values ${tuples.map(() => q).join(", ")}`, [
    ...tuples.flatMap((t) => t),
  ]);
}
