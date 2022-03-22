import { gql } from "@apollo/client";
import { OrganizationRole, WithOrgRoleQuery } from "@parallel/graphql/__types";
import { isAdmin } from "@parallel/utils/roles";
import { NextComponentType } from "next";
import { WithApolloDataContext } from "./withApolloData";

export function withOrgRole<P = {}>(role: OrganizationRole) {
  return function (
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Component: NextComponentType<WithApolloDataContext, P, P>
  ): NextComponentType<WithApolloDataContext, P, P> {
    const { getInitialProps, displayName, ...rest } = Component;
    const WithOrgRole: NextComponentType<WithApolloDataContext, P, P> = function (props) {
      return <Component {...props} />;
    };
    return Object.assign(WithOrgRole, rest, {
      displayName: `WithOrgRole(${displayName ?? Component.name})`,
      getInitialProps: async (context: WithApolloDataContext) => {
        if (!context.apollo) {
          throw new Error(
            `Please, place "withOrgRole" before "withApolloData" in the "compose" argument list.`
          );
        }
        const { data } = await context.apollo.query<WithOrgRoleQuery>({
          query: gql`
            query WithOrgRole {
              me {
                role
              }
            }
          `,
        });
        if (isAdmin(data.me)) {
          return await getInitialProps?.(context);
        } else {
          throw new Error("FORBIDDEN");
        }
      },
    });
  };
}
