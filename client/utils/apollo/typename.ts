import { partition } from "remeda";
import { assert } from "../assert";
import { discriminator } from "../discriminator";
import { MaybeArray, Prettify } from "../types";

export function assertTypename<
  T extends { __typename?: string },
  const Typename extends T["__typename"] & string,
>(value: T, typename: Typename): asserts value is T & { __typename: Typename } {
  assert(value.__typename === typename, "Invalid typename");
}

export function isTypename<
  T extends { __typename?: string },
  const Typename extends T["__typename"] & string,
>(typename: MaybeArray<Typename>): (item: T) => item is Prettify<T & { __typename: Typename }> {
  return discriminator<T, "__typename", Typename>("__typename", typename);
}

export function assertTypenameArray<
  T extends { __typename?: string },
  const Typename extends T["__typename"] & string,
>(value: T[], typename: Typename): asserts value is (T & { __typename: Typename })[] {
  assert(
    value.every((v) => v.__typename === typename),
    "Invalid typename",
  );
}

export function partitionOnTypename<
  T extends { __typename?: string },
  const Typename extends T["__typename"] & string,
>(
  items: T[],
  typename: MaybeArray<Typename>,
): [
  (T & { __typename: Typename })[],
  (T & { __typename: Exclude<T["__typename"], Typename | undefined> })[],
] {
  return partition(items, isTypename(typename)) as any;
}
