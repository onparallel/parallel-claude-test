import { gql } from "@apollo/client";
import { OrganizationRole, WithOrgRoleDocument } from "@parallel/graphql/__types";
import { isAtLeast } from "@parallel/utils/roles";
import { NextComponentType } from "next";
import { RedirectError, WithApolloDataContext } from "./withApolloData";

const _queries = [
  gql`
    query WithOrgRole {
      me {
        id
        role
      }
    }
  `,
];

export function withOrgRole<P = {}>(role: OrganizationRole, orPath = "/app") {
  return function (
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Component: NextComponentType<WithApolloDataContext, P, P>
  ): NextComponentType<WithApolloDataContext, P, P> {
    const { getInitialProps, displayName, ...rest } = Component;
    return Object.assign(Component, rest, {
      displayName: `WithOrgRole(${displayName ?? Component.name})`,
      getInitialProps: async (context: WithApolloDataContext) => {
        if (!context.apollo) {
          throw new Error(
            `Please, place "withOrgRole" before "withApolloData" in the "compose" argument list.`
          );
        }
        const { data } = await context.fetchQuery(WithOrgRoleDocument);
        if (isAtLeast(role, data.me.role)) {
          return await getInitialProps?.(context);
        } else {
          throw new RedirectError(orPath);
        }
      },
    });
  };
}
