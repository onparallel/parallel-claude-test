import { gql, useQuery } from "@apollo/client";
import { useGetUserMetadata_publicUserMetadataDocument } from "@parallel/graphql/__types";

export function useGetUserMetadata() {
  const { data } = useQuery(useGetUserMetadata_publicUserMetadataDocument);
  return data?.publicUserMetadata;
}

useGetUserMetadata.queries = {
  contactsByEmail: gql`
    query useGetUserMetadata_publicUserMetadata {
      publicUserMetadata {
        ip
        countryISO
      }
    }
  `,
};
