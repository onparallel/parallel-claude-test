import { Knex } from "knex";
import { times } from "remeda";

export function sqlValues(tuples: readonly Knex.RawBinding[][], castAs?: string[]) {
  const tupleLength = tuples[0].length;
  const q = castAs
    ? `(${castAs.map((element) => `?::${element}`).join(", ")})`
    : `(${times(tupleLength, () => "?").join(", ")})`;
  return [
    /* sql */ `values ${tuples.map(() => q).join(", ")}` as string,
    [...tuples.flatMap((t) => t)],
  ] as const;
}
