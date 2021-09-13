import { ApolloError, isApolloError as _isApolloError } from "@apollo/client";

export function isApolloError(value: unknown): value is ApolloError {
  return _isApolloError(value as any);
}
