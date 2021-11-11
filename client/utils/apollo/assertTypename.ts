export function assertTypename<T extends { __typename?: string }, Typename extends string>(
  value: T,
  typename: Typename
): asserts value is T & { __typename: Typename } {
  if (value.__typename !== typename) {
    throw new Error("Invalid typename");
  }
}
