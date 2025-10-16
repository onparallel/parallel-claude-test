import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useHasBackgroundCheck_MeDocument } from "@parallel/graphql/__types";
import { isNullish } from "remeda";
import { useConstant } from "./useConstant";

export function useHasBackgroundCheck() {
  const client = useApolloClient();
  const hasBackgroundCheck = useConstant(() => {
    const data = client.readQuery({ query: useHasBackgroundCheck_MeDocument });
    if (isNullish(data)) {
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
        id
        hasBackgroundCheck: hasFeatureFlag(featureFlag: BACKGROUND_CHECK)
      }
    }
  `,
];
