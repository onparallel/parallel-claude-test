import { DocumentNode, OperationVariables, TypedDocumentNode } from "@apollo/client";
import { QueryHookOptions, QueryResult, useQuery } from "@apollo/client/react";
import { assignRef } from "@chakra-ui/hooks";
import { useRef } from "react";

export function useAssertQuery<TData = any, TVariables = OperationVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>
): QueryResult<TData, TVariables> & { data: TData } {
  const { data, ...rest } = useQuery(query, options);
  if (!data) {
    throw new Error("Expected data to be present on the Apollo cache");
  }
  return {
    ...rest,
    data: data!,
  };
}

export function useAssertQueryOrPreviousData<TData = any, TVariables = OperationVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>
): QueryResult<TData, TVariables> & { data: TData } {
  const previous = useRef<TData>();
  const { data, ...rest } = useQuery(query, options);
  if (!data) {
    if (!previous.current) {
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
