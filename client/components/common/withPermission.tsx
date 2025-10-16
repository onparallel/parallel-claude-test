import { gql } from "@apollo/client";
import { WithPermissionDocument } from "@parallel/graphql/__types";
import { MaybeArray, unMaybeArray } from "@parallel/utils/types";
import { NextComponentType } from "next";
import { RedirectError, WithApolloDataContext } from "./withApolloData";

const _queries = [
  gql`
    query WithPermission {
      me {
        id
        permissions
      }
    }
  `,
];

interface WithPermissionOptions {
  orPath?: string;
  operator?: "AND" | "OR";
}

export function withPermission<P = {}>(
  permissions: MaybeArray<string>,
  options: WithPermissionOptions = {},
) {
  return function (
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Component: NextComponentType<WithApolloDataContext, P, P>,
  ): NextComponentType<WithApolloDataContext, P, P> {
    const { getInitialProps, displayName, ...rest } = Component;
    return Object.assign(Component, rest, {
      displayName: `WithPermission(${displayName ?? Component.name})`,
      getInitialProps: async (context: WithApolloDataContext) => {
        if (!context.apollo) {
          throw new Error(
            `Please, place "withPermission" before "withApolloData" in the "compose" argument list.`,
          );
        }
        const { data } = await context.fetchQuery(WithPermissionDocument, {
          // no need to check this every time
          fetchPolicy: "cache-first",
        });

        const { orPath = "/app", operator = "AND" } = options;
        const hasPermission = unMaybeArray(permissions)[operator === "OR" ? "some" : "every"]((p) =>
          data.me.permissions.includes(p),
        );
        if (hasPermission) {
          return await getInitialProps?.(context);
        } else {
          throw new RedirectError(orPath);
        }
      },
    });
  };
}
