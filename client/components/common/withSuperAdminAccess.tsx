import { gql } from "@apollo/client";
import { WithSuperAdminAccessQuery } from "@parallel/graphql/__types";
import { NextComponentType } from "next";
import React from "react";
import { WithApolloDataContext } from "./withApolloData";

export function withSuperAdminAccess<P = {}>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: NextComponentType<WithApolloDataContext, P, P>
): NextComponentType<WithApolloDataContext, P, P> {
  const { getInitialProps, displayName, ...rest } = Component;
  const WithSuperAdminAccess: NextComponentType<
    WithApolloDataContext,
    P,
    P
  > = function (props) {
    return <Component {...props} />;
  };
  return Object.assign(WithSuperAdminAccess, rest, {
    displayName: `WithSuperAdminAccess(${displayName ?? Component.name})`,
    getInitialProps: async (context: WithApolloDataContext) => {
      if (!context.apollo) {
        throw new Error(
          `Please, place "withSuperAdminAccess" before "withApolloData" in the "compose" argument list.`
        );
      }
      const { data } = await context.apollo.query<WithSuperAdminAccessQuery>({
        query: gql`
          query WithSuperAdminAccess {
            me {
              isSuperAdmin
            }
          }
        `,
      });
      if (data?.me?.isSuperAdmin) {
        return await getInitialProps?.(context);
      } else {
        throw new Error("FORBIDDEN");
      }
    },
  });
}
