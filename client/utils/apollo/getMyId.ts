import { DataProxy, gql, useApolloClient } from "@apollo/client";
import { GetMyIdDocument } from "@parallel/graphql/__types";
import { useMemo } from "react";

export function useGetMyId() {
  const apollo = useApolloClient();
  return useMemo(() => {
    return getMyId(apollo);
  }, []);
}

export function getMyId(proxy: DataProxy) {
  const data = proxy.readQuery({
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
