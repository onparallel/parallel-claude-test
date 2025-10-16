import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useHasRemovePreviewFiles_MeDocument } from "@parallel/graphql/__types";
import { isNullish } from "remeda";
import { useConstant } from "./useConstant";

export function useHasRemovePreviewFiles() {
  const client = useApolloClient();
  const hasRemovePreviewFiles = useConstant(() => {
    const data = client.readQuery({ query: useHasRemovePreviewFiles_MeDocument });
    if (isNullish(data)) {
      throw new Error("me.hasRemovePreviewFiles missing on cache");
    }
    return data!.me.hasRemovePreviewFiles;
  });
  return hasRemovePreviewFiles;
}

const _queries = [
  gql`
    query useHasRemovePreviewFiles_Me {
      me {
        id
        hasRemovePreviewFiles: hasFeatureFlag(featureFlag: REMOVE_PREVIEW_FILES)
      }
    }
  `,
];
