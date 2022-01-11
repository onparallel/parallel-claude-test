import { ApolloError, isApolloError as _isApolloError } from "@apollo/client";

export function isApolloError(value: unknown, code?: string): value is ApolloError {
  return _isApolloError(value as any)
    ? code // if code is set, also check for error code
      ? (value as any).graphQLErrors[0]?.extensions?.code === code
      : true
    : false;
}
