import { gql, useFragment } from "@apollo/client";
import { useBrowserMetadata_QueryFragmentDoc } from "@parallel/graphql/__types";

export function useBrowserMetadata() {
  const { data } = useFragment({
    fragment: useBrowserMetadata_QueryFragmentDoc,
    from: { __typename: "Query" },
  });

  if (!data) {
    throw new Error("Expected browser metadata to be present on the Apollo cache");
  }

  return data.metadata!;
}

useBrowserMetadata.fragments = {
  Query: gql`
    fragment useBrowserMetadata_Query on Query {
      metadata {
        browserName
        browserVersion
        country
        deviceType
        ip
      }
    }
  `,
};
