import { gql } from "@apollo/client";
import {
  FeatureFlag,
  HasFeatureFlagDocument,
  HasFeatureFlagQuery,
} from "@parallel/graphql/__types";
import { NextComponentType } from "next";
import { RedirectError, WithApolloDataContext } from "./withApolloData";

const _queries = [
  gql`
    query HasFeatureFlag($featureFlag: FeatureFlag!) {
      me {
        id
        hasFeatureFlag: hasFeatureFlag(featureFlag: $featureFlag)
      }
    }
  `,
];

export function withFeatureFlag(featureFlag: FeatureFlag, orPath = "/path") {
  return function <P = {}>(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Component: NextComponentType<WithApolloDataContext, P, P>
  ): NextComponentType<WithApolloDataContext, P, P> {
    const { getInitialProps, displayName, ...rest } = Component;
    const WithFeatureFlag: NextComponentType<WithApolloDataContext, P, P> = function (props) {
      return <Component {...props} />;
    };
    return Object.assign(WithFeatureFlag, rest, {
      displayName: `WithFeatureFlag(${featureFlag})(${displayName ?? Component.name})`,
      getInitialProps: async (context: WithApolloDataContext) => {
        if (!context.apollo) {
          throw new Error(
            `Please, place "withFeatureFlag" before "withApolloData" in the "compose" argument list.`
          );
        }
        const { data } = await context.fetchQuery(HasFeatureFlagDocument, {
          variables: { featureFlag },
        });
        if (data?.me?.hasFeatureFlag) {
          return await getInitialProps?.(context);
        } else {
          throw new RedirectError(orPath);
        }
      },
    });
  };
}
