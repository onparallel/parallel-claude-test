import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  useUnpinProfileType_unpinProfileTypeDocument,
  useUnpinProfileType_UserFragmentDoc,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { useGetMyId } from "./apollo/getMyId";
import { updateFragment } from "./apollo/updateFragment";

export function useUnpinProfileType() {
  const id = useGetMyId();
  const [unpinProfileType] = useMutation(useUnpinProfileType_unpinProfileTypeDocument);

  return useCallback(
    async (profileTypeId: string) => {
      await unpinProfileType({
        variables: {
          profileTypeId,
        },
        update: (cache, { data }) => {
          if (data?.unpinProfileType) {
            const unnpinedProfileTypeId = data.unpinProfileType.id;
            updateFragment(cache, {
              fragment: useUnpinProfileType_UserFragmentDoc,
              fragmentName: "useUnpinProfileType_User",
              id,
              data: (data) => ({
                ...data!,
                pinnedProfileTypes: data!.pinnedProfileTypes.filter(
                  (pt) => pt.id !== unnpinedProfileTypeId,
                ),
              }),
            });
          }
        },
      });
    },

    [],
  );
}

const _fragments = {
  get ProfileType() {
    return gql`
      fragment useUnpinProfileType_ProfileType on ProfileType {
        id
        isPinned
      }
    `;
  },
  get User() {
    return gql`
      fragment useUnpinProfileType_User on User {
        id
        pinnedProfileTypes {
          ...useUnpinProfileType_ProfileType
        }
      }
      ${this.ProfileType}
    `;
  },
};

const _mutations = [
  gql`
    mutation useUnpinProfileType_unpinProfileType($profileTypeId: GID!) {
      unpinProfileType(profileTypeId: $profileTypeId) {
        ...useUnpinProfileType_ProfileType
      }
    }
    ${_fragments.ProfileType}
  `,
];
