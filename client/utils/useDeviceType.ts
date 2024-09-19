import { gql, useFragment } from "@apollo/client";
import { useDeviceType_QueryFragmentDoc } from "@parallel/graphql/__types";

export function useDeviceType() {
  const { data } = useFragment({
    fragment: useDeviceType_QueryFragmentDoc,
    from: {
      __typename: "Query",
    },
  });
  return data.metadata?.deviceType;
}

useDeviceType.fragments = {
  Query: gql`
    fragment useDeviceType_Query on Query {
      metadata {
        deviceType
      }
    }
  `,
};
