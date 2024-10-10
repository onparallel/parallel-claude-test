import { gql, useMutation } from "@apollo/client";
import {
  usePinProfileType_pinProfileTypeDocument,
  usePinProfileType_UserFragmentDoc,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { useGetMyId } from "./apollo/getMyId";
import { updateFragment } from "./apollo/updateFragment";

export function usePinProfileType() {
  const id = useGetMyId();
  const [pinProfileType] = useMutation(usePinProfileType_pinProfileTypeDocument);

  return useCallback(
    async (profileTypeId: string) => {
      await pinProfileType({
        variables: {
          profileTypeId,
        },
        update: (cache, { data }) => {
          if (data?.pinProfileType) {
            const newPinnedProfileType = data.pinProfileType;
            updateFragment(cache, {
              fragment: usePinProfileType_UserFragmentDoc,
              fragmentName: "usePinProfileType_User",
              id,
              data: (data) => ({
                ...data!,
                pinnedProfileTypes: [...data!.pinnedProfileTypes, newPinnedProfileType],
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
      fragment usePinProfileType_ProfileType on ProfileType {
        id
        isPinned
      }
    `;
  },
  get User() {
    return gql`
      fragment usePinProfileType_User on User {
        id
        pinnedProfileTypes {
          ...usePinProfileType_ProfileType
        }
      }
      ${this.ProfileType}
    `;
  },
};

const _mutations = [
  gql`
    mutation usePinProfileType_pinProfileType($profileTypeId: GID!) {
      pinProfileType(profileTypeId: $profileTypeId) {
        ...usePinProfileType_ProfileType
      }
    }
    ${_fragments.ProfileType}
  `,
];
