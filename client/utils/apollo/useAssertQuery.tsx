import { DocumentNode, OperationVariables, TypedDocumentNode } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { NextComponentType } from "next";
import { ComponentType, useRef } from "react";
import { assignRef } from "../assignRef";

export function useAssertQuery<
  TData = any,
  TVariables extends OperationVariables = OperationVariables,
>(
  ...args: Parameters<typeof useQuery<TData, TVariables>>
): useQuery.Result<TData, TVariables, "complete"> {
  const result = useQuery(...args);
  if (result.dataState === "complete") {
    return result as useQuery.Result<TData, TVariables, "complete">;
  } else {
    console.error("result: ", result);
    throw new Error("Expected data to be present on the Apollo cache");
  }
}

export function useAssertQueryOrPreviousData<
  TData = any,
  TVariables extends OperationVariables = OperationVariables,
>(
  ...args: Parameters<typeof useQuery<TData, TVariables>>
): useQuery.Result<TData, TVariables, "complete"> {
  const previous = useRef<useQuery.Result<TData, TVariables, "complete">>(undefined);
  const result = useQuery(...args);
  if (result.dataState === "complete") {
    assignRef(previous, result);
    return result as useQuery.Result<TData, TVariables, "complete">;
  } else {
    if (previous.current) {
      return previous.current;
    } else {
      throw new Error("Expected data to be present on the Apollo cache");
    }
  }
}

export function withApolloQuery<P, TVariables extends OperationVariables>({
  query,
  variables,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  IfLoading,
}: {
  query: DocumentNode | TypedDocumentNode<any, TVariables>;
  variables: (props: P) => TVariables;
  IfLoading: ComponentType<P>;
}) {
  return function (
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Component: NextComponentType<WithApolloDataContext, P, P>,
  ): NextComponentType<WithApolloDataContext, P, P> {
    const WithApolloQuery: ComponentType<P> = function (props) {
      const loadedRef = useRef(false);
      const { dataState } = useQuery(query, {
        variables: variables(props),
        fetchPolicy: "cache-first",
        skip: loadedRef.current,
      });
      if (dataState === "complete") {
        assignRef(loadedRef, true);
        return <Component {...(props as any)} />;
      } else {
        return <IfLoading {...(props as any)} />;
      }
    };
    const { displayName, ...rest } = Component;
    return Object.assign(WithApolloQuery, rest, {
      displayName: `WithApolloQuery(${displayName ?? Component.name})`,
    });
  };
}
