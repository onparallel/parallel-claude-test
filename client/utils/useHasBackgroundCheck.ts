import { gql, useApolloClient } from "@apollo/client";
import { useHasBackgroundCheck_MeDocument } from "@parallel/graphql/__types";
import { isDefined } from "remeda";
import { useConstant } from "./useConstant";

export function useHasBackgroundCheck() {
  const client = useApolloClient();
  const hasBackgroundCheck = useConstant(() => {
    const data = client.readQuery({ query: useHasBackgroundCheck_MeDocument });
    if (!isDefined(data)) {
      throw new Error("me.hasBackgroundCheck missing on cache");
    }
    return data!.me.hasBackgroundCheck;
  });
  return hasBackgroundCheck;
}

const _queries = [
  gql`
    query useHasBackgroundCheck_Me {
      me {
        hasBackgroundCheck: hasFeatureFlag(featureFlag: BACKGROUND_CHECK)
      }
    }
  `,
];
