import {
  ApolloClient,
  ApolloProvider,
  ApolloQueryResult,
  DocumentNode,
  OperationVariables,
} from "@apollo/client";
import { createApolloClient } from "@parallel/utils/apollo/client";
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
  if (typeof window !== "undefined") {
    Router.push(location);
  } else {
    context.res!.writeHead(302, { Location: location }).end();
  }
  return { __redirect: location };
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
                async fetchQuery<T = any, TVariables = OperationVariables>(
                  query: DocumentNode,
                  options?: {
                    variables?: TVariables;
                    ignoreCache?: boolean;
                  }
                ) {
                  return await new Promise<ApolloQueryResult<T>>((resolve, reject) => {
                    let resolved = false;
                    // On the browser we fetch from cache and fire a request
                    // that will update the cache when it arrives
                    const fetchPolicy =
                      typeof window !== "undefined" && !options?.ignoreCache
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
                  });
                },
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
            }
            const code = error?.graphQLErrors?.[0]?.extensions?.code;
            if (code === "UNAUTHENTICATED") {
              return redirect(context, `/${query.locale}/login`);
            } else if (code === "FORBIDDEN") {
              return redirect(context, `/${query.locale}/app`);
            } else if (
              code === "CONTACT_NOT_VERIFIED" &&
              context.pathname.startsWith("/[locale]/petition/[keycode]")
            ) {
              return redirect(context, `/${query.locale}/petition/${query.keycode}`);
            } else {
              if (process.env.NODE_ENV === "development" && error?.graphQLErrors?.[0]?.extensions) {
                console.error(error?.graphQLErrors?.[0]?.extensions);
              }
              throw error;
            }
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
