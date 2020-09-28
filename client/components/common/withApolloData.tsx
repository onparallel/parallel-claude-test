import {
  ApolloClient,
  ApolloProvider,
  ApolloQueryResult,
  DocumentNode,
  OperationVariables,
} from "@apollo/client";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { parse as parseCookie } from "cookie";
import { NextComponentType } from "next";
import { NextPageContext } from "next/dist/next-server/lib/utils";
import Router from "next/router";
import React from "react";

export type WithApolloDataContext = NextPageContext & {
  apollo: ApolloClient<any>;
  fetchQuery<T = any, TVariables = OperationVariables>(
    query: DocumentNode,
    options?: {
      variables?: TVariables;
      ignoreCache?: boolean;
    }
  ): Promise<ApolloQueryResult<T>>;
};

export type WithDataProps<P> = {
  serverState: any;
  componentProps: P;
};

function redirect(context: NextPageContext, pathname: string, asHref: string) {
  if (process.browser) {
    Router.push(pathname, asHref);
  } else {
    context.res!.writeHead(302, { Location: asHref });
    context.res!.end();
  }
}

export function withApolloData<P = {}>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: NextComponentType<WithApolloDataContext, P, P>
) {
  const WithData: NextComponentType<
    NextPageContext,
    WithDataProps<P>,
    WithDataProps<P>
  > = function ({ componentProps, serverState }) {
    const client = createApolloClient(serverState, {
      getToken() {
        // On the server won't be necessary because all necessary queries were
        // run already on getInitialProps. Everything else should be cached.
        return localStorage.getItem("token")!;
      },
    });
    return (
      <ApolloProvider client={client}>
        <Component {...componentProps} />
      </ApolloProvider>
    );
  };
  const { getInitialProps, displayName, ...rest } = Component;
  return Object.assign(WithData, rest, {
    displayName: `WithApolloData(${displayName ?? Component.name})`,
    getInitialProps: async (context: NextPageContext) => {
      const apollo = createApolloClient(
        {},
        {
          getToken() {
            if (process.browser) {
              return localStorage.getItem("token")!;
            } else {
              const cookies = parseCookie(context.req!.headers.cookie ?? "");
              return cookies["parallel_session"];
            }
          },
        }
      );
      try {
        const componentProps: P =
          (await getInitialProps?.({
            ...context,
            apollo,
            async fetchQuery<T = any, TVariables = OperationVariables>(
              query: DocumentNode,
              options?: {
                variables?: TVariables;
                ignoreCache?: boolean;
              }
            ) {
              return await new Promise<ApolloQueryResult<T>>(
                (resolve, reject) => {
                  let resolved = false;
                  // On the browser we fetch from cache and fire a request
                  // that will update the cache when it arrives
                  const fetchPolicy =
                    process.browser && !options?.ignoreCache
                      ? "cache-and-network"
                      : "network-only";
                  const subscription = apollo
                    .watchQuery<T, TVariables>({
                      query,
                      variables: options?.variables,
                      fetchPolicy,
                    })
                    .subscribe((result) => {
                      if (!resolved) {
                        resolve(result);
                        resolved = true;
                      }
                      // if it's loading means we used cache-and-network and we
                      // are waiting for the network response
                      if (!result.loading) {
                        subscription.unsubscribe();
                      }
                    }, reject);
                }
              );
            },
          })) ?? ({} as P);

        if (process.browser) {
          return {
            componentProps,
            serverState: {},
          };
        } else {
          // if getInitialProps made a redirect, the response is finished.
          if (context.res?.finished) {
            return null as any;
          }
          return {
            // get the cache from the Apollo store
            serverState: apollo.cache.extract(),
            componentProps,
          };
        }
      } catch (error) {
        if (error instanceof RedirectError) {
          return redirect(context, error.pathname, error.asHref);
        }
        const code = error?.graphQLErrors?.[0]?.extensions?.code;
        if (code === "UNAUTHENTICATED") {
          redirect(
            context,
            "/[locale]/login",
            `/${context.query.locale}/login`
          );
        } else if (code === "FORBIDDEN") {
          redirect(context, "/[locale]/app", `/${context.query.locale}/app`);
        } else {
          if (
            process.env.NODE_ENV === "development" &&
            error?.graphQLErrors?.[0]?.extensions
          ) {
            console.error(error?.graphQLErrors?.[0]?.extensions);
          }
          if (!process.browser) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const logger = require("@parallel/utils/logger").logger;
            if (
              ![
                // Errors that are OK
                "PUBLIC_PETITION_NOT_AVAILABLE",
              ].includes(code)
            )
              logger.error(error.message, {
                error,
              });
          }
          throw error;
        }
      }
    },
  });
}

export class RedirectError extends Error {
  constructor(public pathname: string, public asHref: string) {
    super();
  }
}
