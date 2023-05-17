import { partition } from "remeda";
import { MaybeArray, Prettify } from "../types";
import { discriminator } from "../discriminator";

export function assertTypename<
  T extends { __typename?: string },
  Typename extends T["__typename"] & string
>(value: T, typename: Typename): asserts value is T & { __typename: Typename } {
  if (value.__typename !== typename) {
    throw new Error("Invalid typename");
  }
}

export function isTypename<
  T extends { __typename?: string },
  Typename extends T["__typename"] & string
>(typename: MaybeArray<Typename>): (item: T) => item is Prettify<T & { __typename: Typename }> {
  return discriminator<T, "__typename", Typename>("__typename", typename);
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
