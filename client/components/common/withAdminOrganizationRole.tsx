import { gql } from "@apollo/client";
import { WithAdminOrganizationRoleQuery } from "@parallel/graphql/__types";
import { NextComponentType } from "next";
import React from "react";
import { WithApolloDataContext } from "./withApolloData";

export function withAdminOrganizationRole<P = {}>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: NextComponentType<WithApolloDataContext, P, P>
): NextComponentType<WithApolloDataContext, P, P> {
  const { getInitialProps, displayName, ...rest } = Component;
  const WithAdminOrganizationRole: NextComponentType<
    WithApolloDataContext,
    P,
    P
  > = function (props) {
    return <Component {...props} />;
  };
  return Object.assign(WithAdminOrganizationRole, rest, {
    displayName: `WithAdminOrganizationRole(${displayName ?? Component.name})`,
    getInitialProps: async (context: WithApolloDataContext) => {
      if (!context.apollo) {
        throw new Error(
          `Please, place "withAdminOrganizationRole" before "withApolloData" in the "compose" argument list.`
        );
      }
      const {
        data,
      } = await context.apollo.query<WithAdminOrganizationRoleQuery>({
        query: gql`
          query WithAdminOrganizationRole {
            me {
              role
            }
          }
        `,
      });
      if (data?.me?.role === "ADMIN") {
        return await getInitialProps?.(context);
      } else {
        throw new Error("FORBIDDEN");
      }
    },
  });
}
