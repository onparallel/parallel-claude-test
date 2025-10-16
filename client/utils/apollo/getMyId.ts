import { ApolloCache, gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { GetMyIdDocument } from "@parallel/graphql/__types";
import { useMemo } from "react";

export function useGetMyId() {
  const apollo = useApolloClient();
  return useMemo(() => {
    return getMyId(apollo.cache);
  }, []);
}

export function getMyId(cache: ApolloCache) {
  const data = cache.readQuery({
    query: GetMyIdDocument,
  });
  return data!.me.id;
}

const _query = gql`
  query GetMyId {
    me {
      id
    }
  }
`;
