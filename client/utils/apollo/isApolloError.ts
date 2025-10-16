import { CombinedGraphQLErrors } from "@apollo/client";

export function isApolloError(value: unknown, code?: string): value is CombinedGraphQLErrors {
  return CombinedGraphQLErrors.is(value)
    ? code // if code is set, also check for error code
      ? (value as any).errors[0]?.extensions?.code === code
      : true
    : false;
}
