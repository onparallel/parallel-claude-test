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

export function withData<P = {}>(
  Component: NextComponentType<WithDataContext, P, P>
) {
  const getInitialProps = Component.getInitialProps;
  const withData: NextComponentType<
    NextPageContext,
    WithDataProps<P>,
    WithDataProps<P>
  > = function ({ componentProps, serverState }) {
    const client = createApolloClient(serverState, {
      getToken() {
        return localStorage.getItem("token")!;
      },
    });
    return (
      <ApolloProvider client={client}>
        <Component {...componentProps}></Component>
      </ApolloProvider>
    );
  };
  for (const key of Object.keys(Component)) {
    if (key === "getInitialProps") {
      // ignore
    } else {
      (withData as any)[key] = (Component as any)[key];
    }
  }
  withData.displayName = `WithData(${Component.displayName || Component.name})`;
  withData.getInitialProps = async (context: NextPageContext) => {
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
    let componentProps: P = {} as P;
    let serverState: any = {};
    if (getInitialProps) {
      try {
        componentProps = await getInitialProps({
          ...context,
          apollo,
        });
      } catch (error) {
        // Check for NotAuthenticated errors and redirect to Login
        const notAuthenticated = error?.graphQLErrors?.some((e: any) => {
          return e?.message === "Not authorized";
        });
        if (notAuthenticated) {
          if (!process.browser) {
            context.res!.writeHead(302, {
              Location: `/${context.query.locale}/login`,
            });
            context.res!.end();
            return;
          } else {
            Router.push("/[locale]/login", `/${context.query.locale}/login`);
          }
        } else {
          if (error?.networkError?.result?.errors?.[0]) {
            console.log(error?.networkError?.result?.errors?.[0]);
          }
          throw error;
        }
      }
    }

    // Run all graphql queries in the component tree
    // and extract the resulting data
    if (!process.browser) {
      if (context.res?.finished) {
        // When redirecting, the response is finished.
        return null as any;
      }
      // Extract query data from the Apollo's store
      serverState = apollo.cache.extract();
    }

    return {
      serverState,
      componentProps,
    };
  };
  return withData;
}
