import { gql, useQuery } from "@apollo/client";
import { useGetUserCountryISO_publicGetCountryDocument } from "@parallel/graphql/__types";

export function useGetUserCountryISO() {
  const { data } = useQuery(useGetUserCountryISO_publicGetCountryDocument);
  return data?.publicGetCountry ?? undefined;
}

useGetUserCountryISO.queries = {
  contactsByEmail: gql`
    query useGetUserCountryISO_publicGetCountry {
      publicGetCountry
    }
  `,
};
