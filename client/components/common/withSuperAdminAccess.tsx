import { gql } from "@apollo/client";
import { WithSuperAdminAccessDocument } from "@parallel/graphql/__types";
import { NextComponentType } from "next";
import { RedirectError, WithApolloDataContext } from "./withApolloData";

const _queries = [
  gql`
    query WithSuperAdminAccess {
      realMe {
        id
        isSuperAdmin
      }
    }
  `,
];

export function withSuperAdminAccess<P = {}>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: NextComponentType<WithApolloDataContext, P, P>,
): NextComponentType<WithApolloDataContext, P, P> {
  const { getInitialProps, displayName, ...rest } = Component;
  return Object.assign(Component, rest, {
    displayName: `WithSuperAdminAccess(${displayName ?? Component.name})`,
    getInitialProps: async (context: WithApolloDataContext) => {
      if (!context.apollo) {
        throw new Error(
          `Please, place "withSuperAdminAccess" before "withApolloData" in the "compose" argument list.`,
        );
      }
      const { data } = await context.fetchQuery(WithSuperAdminAccessDocument);
      if (data?.realMe?.isSuperAdmin) {
        return await getInitialProps?.(context);
      } else {
        throw new RedirectError("/app");
      }
    },
  });
}
