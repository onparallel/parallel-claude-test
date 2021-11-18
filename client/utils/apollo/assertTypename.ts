export function assertTypename<T extends { __typename?: string }, Typename extends T["__typename"]>(
  value: T,
  typename: Typename
): asserts value is T & { __typename: Typename } {
  if (value.__typename !== typename) {
    throw new Error("Invalid typename");
  }
}

export function assertTypenameArray<
  T extends { __typename?: string },
  Typename extends T["__typename"]
>(value: T[], typename: Typename): asserts value is (T & { __typename: Typename })[] {
  if (value.some((v) => v.__typename !== typename)) {
    throw new Error("Invalid typename");
  }
}
