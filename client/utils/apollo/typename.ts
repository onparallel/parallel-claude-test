import { partition } from "remeda";
import { MaybeArray } from "../types";

export function assertTypename<
  T extends { __typename?: string },
  Typename extends T["__typename"] & string
>(value: T, typename: Typename): asserts value is T & { __typename: Typename } {
  if (value.__typename !== typename) {
    throw new Error("Invalid typename");
  }
}

export function isTypename<Typename extends string>(typename: MaybeArray<Typename>) {
  return function _isTypename<T extends { __typename?: string }>(
    value: T
  ): value is T & { __typename: Typename } {
    return value.__typename === typename;
  };
}

export function assertTypenameArray<
  T extends { __typename?: string },
  Typename extends T["__typename"] & string
>(value: T[], typename: Typename): asserts value is (T & { __typename: Typename })[] {
  if (value.some((v) => v.__typename !== typename)) {
    throw new Error("Invalid typename");
  }
}

export function partitionOnTypename<
  T extends { __typename?: string },
  Typename extends T["__typename"] & string
>(
  items: T[],
  typename: MaybeArray<Typename>
): [
  (T & { __typename: Typename })[],
  (T & { __typename: Exclude<T["__typename"], Typename | undefined> })[]
] {
  return partition(items, isTypename(typename)) as any;
}
