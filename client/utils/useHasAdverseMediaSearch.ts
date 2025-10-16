import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useHasAdverseMediaSearch_MeDocument } from "@parallel/graphql/__types";
import { isNullish } from "remeda";
import { useConstant } from "./useConstant";

export function useHasAdverseMediaSearch() {
  const client = useApolloClient();
  const hasAdverseMediaSearch = useConstant(() => {
    const data = client.readQuery({ query: useHasAdverseMediaSearch_MeDocument });
    if (isNullish(data)) {
      throw new Error("me.hasAdverseMediaSearch missing on cache");
    }
    return data!.me.hasAdverseMediaSearch;
  });
  return hasAdverseMediaSearch;
}

const _queries = [
  gql`
    query useHasAdverseMediaSearch_Me {
      me {
        id
        hasAdverseMediaSearch: hasFeatureFlag(featureFlag: ADVERSE_MEDIA_SEARCH)
      }
    }
  `,
];
