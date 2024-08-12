import { gql, useApolloClient } from "@apollo/client";
import { useHasIdVerification_MeDocument } from "@parallel/graphql/__types";
import { isDefined } from "remeda";
import { useConstant } from "./useConstant";

export function useHasIdVerification() {
  const client = useApolloClient();
  const hasIdVerification = useConstant(() => {
    const data = client.readQuery({ query: useHasIdVerification_MeDocument });
    if (!isDefined(data)) {
      throw new Error("me.organization.hasIdVerification missing on cache");
    }
    return data!.me.organization.hasIdVerification;
  });
  return hasIdVerification;
}

const _queries = [
  gql`
    query useHasIdVerification_Me {
      me {
        id
        organization {
          id
          hasIdVerification: hasIntegration(integration: ID_VERIFICATION)
        }
      }
    }
  `,
];
