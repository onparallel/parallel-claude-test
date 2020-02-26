import { QueryHookOptions, useQuery } from "@apollo/react-hooks";
import { OperationVariables } from "apollo-boost";
import { DocumentNode } from "graphql";

export function useQueryData<TData = any, TVariables = OperationVariables>(
  query: DocumentNode,
  options?: QueryHookOptions<TData, TVariables>
): TData {
  const { data } = useQuery(query, options);
  if (!data) {
    throw new Error("Expected data to be present on the Apollo cache");
  }
  return data;
}
