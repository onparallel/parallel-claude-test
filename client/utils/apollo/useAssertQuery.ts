import { DocumentNode, OperationVariables, TypedDocumentNode } from "@apollo/client";
import { QueryHookOptions, QueryResult, useApolloClient, useQuery } from "@apollo/client/react";
import { assignRef } from "@chakra-ui/hooks";
import { useRef } from "react";
import stringify from "fast-safe-stringify";

export function useAssertQuery<
  TData = any,
  TVariables extends OperationVariables = OperationVariables
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>
): QueryResult<TData, TVariables> & { data: TData } {
  const { data, ...rest } = useQuery(query, options);
  const apollo = useApolloClient();
  if (!data) {
    try {
      console.log(JSON.parse(stringify((apollo.cache as any).data.data)));
      console.log((rest as any).diff);
    } catch {}
    throw new Error(`Expected data to be present on the Apollo cache`);
  }
  return {
    ...rest,
    data: data!,
  };
}

export function useAssertQueryOrPreviousData<
  TData = any,
  TVariables extends OperationVariables = OperationVariables
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>
): QueryResult<TData, TVariables> & { data: TData } {
  const previous = useRef<TData>();
  const apollo = useApolloClient();
  const { data, ...rest } = useQuery(query, options);
  if (!data) {
    if (!previous.current) {
      console.log((rest as any).diff.missing);
      console.log((apollo.cache as any).data.data);
      throw new Error("Expected data to be present on the Apollo cache");
    } else {
      return {
        data: previous.current!,
        ...rest,
      };
    }
  } else {
    assignRef(previous, data);
    return {
      data: data!,
      ...rest,
    };
  }
}
