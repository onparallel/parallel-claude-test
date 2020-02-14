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
  > = function({ componentProps, serverState }) {
    const client = createApolloClient(serverState, {
      getToken() {
        return localStorage.getItem("token")!;
      }
    });
    return (
      <ApolloProvider client={client}>
        <Component {...componentProps}></Component>
      </ApolloProvider>
    );
  };
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
        }
      }
    );
    let componentProps: P = {} as P;
    let serverState: any = {};
    if (getInitialProps) {
      try {
        componentProps = await getInitialProps({
          ...context,
          apollo
        });
      } catch (error) {
        // Check for NotAuthenticated errors and redirect to Login
        const notAuthenticated = error?.graphQLErrors?.some((e: any) => {
          return (
            e?.message === "Not authorized" &&
            e?.extensions?.exception?.originalError?.name === "NotAuthenticated"
          );
        });
        if (notAuthenticated) {
          if (!process.browser) {
            context.res!.writeHead(302, {
              Location: `/${context.query.locale}/login`
            });
            context.res!.end();
          } else {
            Router.push(`/${context.query.locale}/login`);
          }
        } else {
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
      componentProps
    };
  };
  return withData;
}

// export default ComposedComponent => {
//   return class WithData extends React.Component {
//     static displayName = `WithData(${ComposedComponent.displayName})`;
//     static propTypes = {
//       serverState: PropTypes.object.isRequired
//     };

//     static async getInitialProps(context) {
//       let serverState = {};

//       // Setup a server-side one-time-use apollo client for initial props and
//       // rendering (on server)
//       let apollo = initApollo(
//         {},
//         {
//           getToken: () => getCookie(context)
//         }
//       );

//       // Evaluate the composed component's getInitialProps()
//       let composedInitialProps = {};
//       if (ComposedComponent.getInitialProps) {
//         composedInitialProps = await ComposedComponent.getInitialProps(
//           context,
//           apollo
//         );
//       }

//       // Run all graphql queries in the component tree
//       // and extract the resulting data
//       if (!process.browser) {
//         if (context.res && context.res.finished) {
//           // When redirecting, the response is finished.
//           // No point in continuing to render
//           return;
//         }

//         // Provide the `url` prop data in case a graphql query uses it
//         const url = { query: context.query, pathname: context.pathname };
//         try {
//           // Run all GraphQL queries
//           const app = (
//             <ApolloProvider client={apollo}>
//               <ComposedComponent url={url} {...composedInitialProps} />
//             </ApolloProvider>
//           );
//           await getDataFromTree(app, {
//             router: {
//               query: context.query,
//               pathname: context.pathname,
//               asPath: context.asPath
//             }
//           });
//         } catch (error) {
//           // Prevent Apollo Client GraphQL errors from crashing SSR.
//           // Handle them in components via the data.error prop:
//           // http://dev.apollodata.com/react/api-queries.html#graphql-query-data-error
//         }
//         // getDataFromTree does not call componentWillUnmount
//         // head side effect therefore need to be cleared manually
//         Head.rewind();

//         // Extract query data from the Apollo's store
//         serverState = apollo.cache.extract();
//       }

//       return {
//         serverState,
//         ...composedInitialProps
//       };
//     }

//     constructor(props) {
//       super(props);
//       // Note: Apollo should never be used on the server side beyond the initial
//       // render within `getInitialProps()` above (since the entire prop tree
//       // will be initialized there), meaning the below will only ever be
//       // executed on the client.
//       this.apollo = initApollo(this.props.serverState, {
//         getToken: () => getCookie()
//       });
//     }

//     render() {
//       return (
//         <ApolloProvider client={this.apollo}>
//           <ComposedComponent {...this.props} />
//         </ApolloProvider>
//       );
//     }
//   };
// };
