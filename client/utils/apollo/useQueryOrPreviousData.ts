import { DocumentNode, OperationVariables, TypedDocumentNode } from "@apollo/client";
import { QueryHookOptions, QueryResult, useQuery } from "@apollo/client/react";
import { assignRef } from "@chakra-ui/hooks";
import { useRef } from "react";

export function useQueryOrPreviousData<TData = any, TVariables = OperationVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>
): QueryResult<TData, TVariables> {
  const previous = useRef<TData>();
  const { data, ...rest } = useQuery(query, options);
  if (!data) {
    return {
      data: previous.current,
      ...rest,
    };
  } else {
    assignRef(previous, data);
    return {
      data,
      ...rest,
    };
  }
}
