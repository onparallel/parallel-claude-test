import { DataProxy, gql } from "@apollo/client";
import { GetMyIdQuery } from "@parallel/graphql/__types";

export function getMyId(proxy: DataProxy) {
  const data = proxy.readQuery<GetMyIdQuery>({
    query: gql`
      query GetMyId {
        me {
          id
        }
      }
    `,
  });

  return data!.me.id;
}
