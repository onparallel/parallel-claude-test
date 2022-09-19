import { gql, useQuery } from "@apollo/client";
import { useGetDefaultMentionables_permissionsQueryDocument } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { uniqBy } from "remeda";
import { isTypename } from "./apollo/typename";
import { createMentionPlugin } from "./slate/MentionPlugin";

export function useGetDefaultMentionables(petitionId: string) {
  const { data } = useQuery(useGetDefaultMentionables_permissionsQueryDocument, {
    variables: { petitionId },
    fetchPolicy: "cache-and-network",
  });
  return useMemo(() => {
    return uniqBy(
      [
        ...(data?.petition?.permissions
          .filter(isTypename("PetitionUserPermission"))
          .filter((p) => p.permissionType === "OWNER")
          .map((p) => p.user) ?? []),
        ...(data?.petition?.permissions
          .filter(isTypename("PetitionUserGroupPermission"))
          .map((p) => p.group) ?? []),
        ...(data?.petition?.permissions
          .filter(isTypename("PetitionUserPermission"))
          .filter((p) => p.permissionType !== "OWNER")
          .map((p) => p.user) ?? []),
        ...(data?.petition?.permissions
          .filter(isTypename("PetitionUserGroupPermission"))
          .flatMap((p) => p.group.members.map((m) => m.user)) ?? []),
      ].filter((m) => (m.__typename === "User" && m.isMe ? false : true)),
      (m) => m.id
    );
  }, [data]);
}

const _queries = [
  gql`
    query useGetDefaultMentionables_permissionsQuery($petitionId: GID!) {
      petition(id: $petitionId) {
        id
        permissions {
          ... on PetitionUserPermission {
            permissionType
            user {
              id
              ...createMentionPlugin_UserOrUserGroup
              isMe
            }
          }
          ... on PetitionUserGroupPermission {
            group {
              id
              ...createMentionPlugin_UserOrUserGroup
              members {
                id
                user {
                  id
                  ...createMentionPlugin_UserOrUserGroup
                  isMe
                }
              }
            }
          }
        }
      }
    }
    ${createMentionPlugin.fragments.UserOrUserGroup}
  `,
];
