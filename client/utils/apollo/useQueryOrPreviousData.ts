import { DocumentNode, OperationVariables, TypedDocumentNode } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useRef } from "react";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { assignRef } from "../assignRef";

export function useQueryOrPreviousData<
  TData = any,
  TVariables extends OperationVariables = OperationVariables,
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: useQuery.Options<TData, TVariables>,
  shouldUsePrevious: (
    prev?: useQuery.Result<TData, TVariables, "complete">,
    current?: useQuery.Result<TData, TVariables, "complete" | "empty">,
  ) => boolean = () => true,
): useQuery.Result<TData, TVariables, "complete" | "empty"> {
  const previousRef = useRef<useQuery.Result<TData, TVariables, "complete">>(undefined);
  const queryResult = useQuery<TData, TVariables>(
    query,
    options as useQuery.Options<TData, TVariables>,
  );
  assert(queryResult.dataState === "complete" || queryResult.dataState === "empty");

  if (queryResult.dataState === "complete") {
    assignRef(previousRef, queryResult as useQuery.Result<TData, TVariables, "complete">);
    return queryResult;
  } else if (
    isNonNullish(previousRef.current) &&
    shouldUsePrevious(previousRef.current, queryResult)
  ) {
    return previousRef.current;
  } else {
    return queryResult;
  }
}
