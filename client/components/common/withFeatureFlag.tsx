import { gql } from "@apollo/client";
import { FeatureFlag, HasFeatureFlagQuery } from "@parallel/graphql/__types";
import { NextComponentType } from "next";
import { WithApolloDataContext } from "./withApolloData";

export function withFeatureFlag(featureFlag: FeatureFlag) {
  return function <P = {}>(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Component: NextComponentType<WithApolloDataContext, P, P>
  ): NextComponentType<WithApolloDataContext, P, P> {
    const { getInitialProps, displayName, ...rest } = Component;
    const WithFeatureFlag: NextComponentType<
      WithApolloDataContext,
      P,
      P
    > = function (props) {
      return <Component {...props} />;
    };
    return Object.assign(WithFeatureFlag, rest, {
      displayName: `WithFeatureFlag(${featureFlag})(${
        displayName ?? Component.name
      })`,
      getInitialProps: async (context: WithApolloDataContext) => {
        if (!context.apollo) {
          throw new Error(
            `Please, place "withFeatureFlag" before "withApolloData" in the "compose" argument list.`
          );
        }
        const { data } = await context.apollo.query<HasFeatureFlagQuery>({
          query: gql`
            query HasFeatureFlag($featureFlag: FeatureFlag!) {
              me {
                id
                hasFeatureFlag: hasFeatureFlag(featureFlag: $featureFlag)
              }
            }
          `,
          variables: { featureFlag },
        });
        if (data?.me?.hasFeatureFlag) {
          return await getInitialProps?.(context);
        } else {
          throw new Error("FORBIDDEN");
        }
      },
    });
  };
}
