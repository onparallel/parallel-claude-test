import { ApolloProvider } from "@apollo/react-hooks";
import { createApolloClient } from "@parallel/utils/apollo";
import { ApolloClient } from "apollo-boost";
import { parse as parseCookie } from "cookie";
import { NextComponentType } from "next";
import { NextPageContext } from "next/dist/next-server/lib/utils";
import React from "react";
import Router from "next/router";

export type WithDataContext = NextPageContext & {
  apollo: ApolloClient<any>;
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
  Component: NextComponentType<WithDataContext, P, P>
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
        <Component {...componentProps}></Component>
      </ApolloProvider>
    );
  };
  const { getInitialProps, displayName, ...rest } = Component;
  return Object.assign(WithData, rest, {
    displayName: `WithData(${displayName ?? Component.name})`,
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
          (await getInitialProps?.({ ...context, apollo })) ?? ({} as P);

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
