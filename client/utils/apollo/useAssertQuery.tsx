import { DocumentNode, OperationVariables, TypedDocumentNode } from "@apollo/client";
import { QueryHookOptions, QueryResult, useQuery } from "@apollo/client/react";
import { WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { NextComponentType } from "next";
import { ComponentType, useRef } from "react";
import { assignRef } from "../assignRef";

export function useAssertQuery<
  TData = any,
  TVariables extends OperationVariables = OperationVariables,
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>,
): QueryResult<TData, TVariables> & { data: TData } {
  const { data, ...rest } = useQuery(query, options);
  if (!data) {
    try {
      // eslint-disable-next-line no-console
      console.log((rest as any).diff);
      // eslint-disable-next-line no-console
      console.log(rest.error);
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
  TVariables extends OperationVariables = OperationVariables,
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>,
): QueryResult<TData, TVariables> & { data: TData } {
  const previous = useRef<TData>();
  const { data, ...rest } = useQuery(query, options);
  if (!data) {
    if (!previous.current) {
      // eslint-disable-next-line no-console
      console.log((rest as any).diff?.missing);
      // eslint-disable-next-line no-console
      console.log(rest.error);
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

export function withAssertApolloQuery<P, TVariables extends OperationVariables>({
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
    const WithAssertApolloQuery: ComponentType<P> = function (props) {
      const { loading } = useQuery(query, {
        variables: variables(props),
        fetchPolicy: "cache-first",
      });
      return loading ? <IfLoading {...(props as any)} /> : <Component {...(props as any)} />;
    };
    const { displayName, ...rest } = Component;
    return Object.assign(WithAssertApolloQuery, rest, {
      displayName: `WithAssertApolloQuery(${displayName ?? Component.name})`,
    });
  };
}
