import { DocumentNode, OperationVariables, TypedDocumentNode } from "@apollo/client";
import { QueryHookOptions, QueryResult, useQuery } from "@apollo/client/react";
import { assignRef } from "@chakra-ui/hooks";
import { useRef } from "react";
import { isDefined } from "remeda";

export function useQueryOrPreviousData<TData = any, TVariables = OperationVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>,
  usePrevious: (
    prev?: QueryHookOptions<TData, TVariables>,
    current?: QueryHookOptions<TData, TVariables>
  ) => boolean = () => true
): QueryResult<TData, TVariables> {
  const previousRef = useRef<{
    data: TData | undefined;
    options?: QueryHookOptions<TData, TVariables>;
  }>({ data: undefined, options: undefined });
  const { data, ...rest } = useQuery(query, options);
  const previous = previousRef.current;
  if (isDefined(data)) {
    assignRef(previousRef, { data, options });
    return { data, ...rest };
  } else {
    if (usePrevious(previous.options, options)) {
      return { data: previous.data, ...rest };
    } else {
      return { data, ...rest };
    }
  }
}
