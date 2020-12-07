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

export const SERVER_STATE = "__SERVER_STATE__";

export type WithServerState<P> = P & {
  [SERVER_STATE]: any;
};

export function redirect(context: NextPageContext, location: string) {
  if (process.browser) {
    Router.push(location);
  } else {
    context.res?.writeHead?.(302, { Location: location }).end();
  }
}

export function withApolloData<P = {}>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: NextComponentType<WithApolloDataContext, P, P>
): NextComponentType<NextPageContext, WithServerState<P>, WithServerState<P>> {
  const WithApolloData: NextComponentType<
    NextPageContext,
    WithServerState<P>,
    WithServerState<P>
  > = function ({ [SERVER_STATE]: serverState, ...props }) {
    const client = createApolloClient(serverState, {
      getToken() {
        // On the server won't be necessary because all necessary queries were
        // run already on getInitialProps. Everything else should be cached.
        return localStorage.getItem("token")!;
      },
    });
    return (
      <ApolloProvider client={client}>
        <Component {...(props as any)} />
      </ApolloProvider>
    );
  };
  const { getInitialProps, displayName, ...rest } = Component;
  return Object.assign(WithApolloData, rest, {
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
            ...componentProps,
            [SERVER_STATE]: {},
          };
        } else {
          // if getInitialProps made a redirect, the response is finished.
          if (context.res?.writableEnded) {
            return null as any;
          }
          return {
            ...componentProps,
            // get the cache from the Apollo store
            [SERVER_STATE]: apollo.cache.extract(),
          };
        }
      } catch (error) {
        if (error instanceof RedirectError) {
          return redirect(context, error.location);
        }
        const code = error?.graphQLErrors?.[0]?.extensions?.code;
        if (code === "UNAUTHENTICATED") {
          redirect(context, `/${context.query.locale}/login`);
        } else if (code === "FORBIDDEN") {
          redirect(context, `/${context.query.locale}/app`);
        } else {
          if (
            process.env.NODE_ENV === "development" &&
            error?.graphQLErrors?.[0]?.extensions
          ) {
            console.error(error?.graphQLErrors?.[0]?.extensions);
          }
          throw error;
        }
      }
    },
  });
}

export class RedirectError extends Error {
  constructor(public location: string) {
    super();
  }
}
