import { ApolloClient, DocumentNode, NetworkStatus, OperationVariables } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { NextComponentType, NextPageContext } from "next";
import Router from "next/router";
import { assert } from "ts-essentials";

export type WithApolloDataContext = NextPageContext & {
  apollo: ApolloClient;
  fetchQuery: {
    <TData = unknown, TVariables extends OperationVariables = OperationVariables>(
      ...args:
        | [
            query: DocumentNode | TypedDocumentNode<TData, TVariables>,
            options: {
              fetchPolicy?: "cache-first" | "cache-and-network" | "network-only";
            } & ({} extends TVariables ? { variables?: TVariables } : { variables: TVariables }),
          ]
        | ({} extends TVariables
            ? [query: DocumentNode | TypedDocumentNode<TData, TVariables>]
            : never)
    ): Promise<{ data: TData }>;
  };
};

const SERVER_STATE = "__SERVER_STATE__";

type WithServerState<P> = P & {
  [SERVER_STATE]: any;
};

export function redirect(context: NextPageContext, location: string, reload = false) {
  const locationWithLocale =
    context.locale !== context.defaultLocale ? `/${context.locale}${location}` : location;
  if (typeof window !== "undefined") {
    if (reload) {
      window.location.href = locationWithLocale;
    } else {
      Router.push(location, undefined, { locale: context.locale });
    }
  } else {
    context.res!.writeHead(302, { Location: locationWithLocale }).end();
  }
  return { __redirect: location };
}

export function withApolloData<P = {}>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: NextComponentType<WithApolloDataContext, P, P>,
): NextComponentType<NextPageContext, WithServerState<P>, WithServerState<P>> {
  const WithApolloData: NextComponentType<
    NextPageContext,
    WithServerState<P>,
    WithServerState<P>
  > = function ({ [SERVER_STATE]: serverState, ...props }) {
    const client = createApolloClient(serverState, {});
    return (
      <ApolloProvider client={client}>
        <Component {...(props as any)} />
      </ApolloProvider>
    );
  };
  const { getInitialProps, displayName, ...rest } = Component;
  return Object.assign(WithApolloData, rest, {
    displayName: `WithApolloData(${displayName ?? Component.name})`,
    getInitialProps: getInitialProps
      ? async (context: NextPageContext) => {
          const { req, res, query } = context;
          const apollo = createApolloClient({}, { req });
          try {
            const props: P =
              (await getInitialProps?.({
                ...context,
                apollo,
                fetchQuery: (async <
                  TData = any,
                  TVariables extends OperationVariables = OperationVariables,
                >(
                  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
                  options?: {
                    fetchPolicy?: "cache-first" | "cache-and-network" | "network-only";
                  } & ({} extends TVariables
                    ? { variables?: TVariables }
                    : { variables: TVariables }),
                ) => {
                  return await new Promise<{ data: TData }>((resolve, reject) => {
                    let resolved = false;
                    // On the browser we fetch from cache and fire a request
                    // that will update the cache when it arrives
                    const fetchPolicy =
                      typeof window === "undefined"
                        ? "network-only"
                        : (options?.fetchPolicy ?? "cache-and-network");
                    const subscription = apollo
                      .watchQuery({
                        query,
                        variables: options?.variables,
                        fetchPolicy,
                      } as ApolloClient.WatchQueryOptions<TData, TVariables>)
                      .subscribe({
                        next: (result) => {
                          if (
                            result.dataState === "empty" &&
                            result.networkStatus === NetworkStatus.loading
                          ) {
                            // do nothing, wait for result
                            return;
                          }
                          if (result.networkStatus === NetworkStatus.error) {
                            reject(result.error!);
                            subscription.unsubscribe();
                            return;
                          }
                          assert(result.dataState === "complete");
                          if (!resolved) {
                            resolve(result);
                            resolved = true;
                          }
                          // if it's loading means we used a "network" policy and we are waiting for the network response
                          if (!result.loading && fetchPolicy !== "cache-first") {
                            subscription.unsubscribe();
                          }
                        },
                        error: reject,
                      });
                  });
                }) as WithApolloDataContext["fetchQuery"],
              })) ?? ({} as P);

            if (typeof window !== "undefined") {
              return {
                ...props,
                [SERVER_STATE]: {},
              };
            } else {
              // if getInitialProps made a redirect, the response is finished.
              if (res!.writableEnded) {
                return null;
              }
              return {
                ...props,
                // get the cache from the Apollo store
                [SERVER_STATE]: apollo.cache.extract(),
              };
            }
          } catch (error) {
            if (error instanceof RedirectError) {
              return redirect(context, error.location);
            } else if (isApolloError(error)) {
              const code = error.errors[0]?.extensions?.code;
              if (code === "UNAUTHENTICATED") {
                const url = (req?.url ?? context.asPath) as string;
                const [path, params] = url.split("?");
                // remove any redirect params to avoid infinite redirect
                const _params = (params ?? "")
                  .split("&")
                  .filter((p) => !p.startsWith("redirect="))
                  .join("&");
                const from = params ? `${path}?${_params}` : path;
                return redirect(context, `/login?redirect=${encodeURIComponent(from)}`, true);
              } else if (code === "FORBIDDEN") {
                return redirect(context, `/app/petitions`);
              } else if (
                code === "CONTACT_NOT_VERIFIED" &&
                context.pathname.startsWith("/petition/[keycode]")
              ) {
                return redirect(context, `/petition/${query.keycode}`);
              } else {
                if (process.env.NODE_ENV === "development" && error.errors[0]?.extensions) {
                  console.error(error.errors[0].extensions);
                }
              }
            }
            throw error;
          }
        }
      : undefined,
  });
}

export class RedirectError extends Error {
  constructor(public location: string) {
    super();
  }
}
