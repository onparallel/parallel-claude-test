import { gql, useMutation, useQuery } from "@apollo/client";
import { VariablesOf } from "@graphql-typed-document-node/core";
import { useConfirmCommentMentionAndShareDialog } from "@parallel/components/common/dialogs/ConfirmCommentMentionAndShareDialog";
import { PetitionFieldComment } from "@parallel/components/common/PetitionFieldComment";
import { removeMentionInputElements } from "@parallel/components/common/slate/CommentEditor";
import { UserGroupReference } from "@parallel/components/common/UserGroupReference";
import { UserReference } from "@parallel/components/common/UserReference";
import {
  usePetitionCommentsMutations_createPetitionCommentDocument,
  usePetitionCommentsMutations_deletePetitionCommentDocument,
  usePetitionCommentsMutations_getUsersOrGroupsDocument,
  usePetitionCommentsMutations_updatePetitionCommentDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { isApolloError } from "../apollo/isApolloError";
import { Maybe } from "../types";

export function useCreatePetitionComment() {
  const [createPetitionComment] = useMutation(
    usePetitionCommentsMutations_createPetitionCommentDocument,
  );

  const showConfirmCommentMentionAndShareDialog = useConfirmCommentMentionAndShareDialog();
  const { refetch: fetchUsersOrGroups } = useQuery(
    usePetitionCommentsMutations_getUsersOrGroupsDocument,
    { skip: true },
  );

  return useCallback(
    async ({
      content,
      ...variables
    }: Pick<
      VariablesOf<typeof usePetitionCommentsMutations_createPetitionCommentDocument>,
      "petitionId" | "petitionFieldId" | "isInternal" | "content"
    >) => {
      try {
        await createPetitionComment({
          variables: { content: removeMentionInputElements(content), ...variables },
        });
      } catch (e) {
        if (isApolloError(e, "NO_PERMISSIONS_MENTION_ERROR")) {
          const ids = e.graphQLErrors[0].extensions!.ids as string[];
          const { data } = await fetchUsersOrGroups({ ids });
          try {
            const shareResult = await showConfirmCommentMentionAndShareDialog({
              petitionId: variables.petitionId,
              usersAndGroups: data.getUsersOrGroups,
              isInternal: variables.isInternal,
            });
            await createPetitionComment({
              variables: {
                ...variables,
                content: removeMentionInputElements(content),
                throwOnNoPermission: false,
                ...shareResult,
              },
            });
          } catch {}
        }
      }
    },
    [createPetitionComment],
  );
}

export function useUpdatePetitionComment() {
  const [updatePetitionComment] = useMutation(
    usePetitionCommentsMutations_updatePetitionCommentDocument,
  );
  const showConfirmCommentMentionAndShareDialog = useConfirmCommentMentionAndShareDialog();
  const { refetch: fetchUsersOrGroups } = useQuery(
    usePetitionCommentsMutations_getUsersOrGroupsDocument,
    { skip: true },
  );

  return useCallback(
    async ({
      content,
      ...variables
    }: Pick<
      VariablesOf<typeof usePetitionCommentsMutations_updatePetitionCommentDocument>,
      "petitionId" | "petitionFieldCommentId" | "content"
    > & { isInternal?: Maybe<boolean> }) => {
      try {
        await updatePetitionComment({
          variables: { content: removeMentionInputElements(content), ...variables },
        });
      } catch (e) {
        if (isApolloError(e, "NO_PERMISSIONS_MENTION_ERROR")) {
          const ids = e.graphQLErrors[0].extensions!.ids as string[];
          const { data } = await fetchUsersOrGroups({ ids });
          try {
            const shareResult = await showConfirmCommentMentionAndShareDialog({
              petitionId: variables.petitionId,
              usersAndGroups: data.getUsersOrGroups,
              isInternal: variables.isInternal,
            });
            await updatePetitionComment({
              variables: {
                ...variables,
                content: removeMentionInputElements(content),
                throwOnNoPermission: false,
                ...shareResult,
              },
            });
          } catch {}
        }
      }
    },
    [updatePetitionComment],
  );
}

export function useDeletePetitionComment() {
  const [deletePetitionComment] = useMutation(
    usePetitionCommentsMutations_deletePetitionCommentDocument,
  );
  return useCallback(
    async (
      variables: VariablesOf<typeof usePetitionCommentsMutations_deletePetitionCommentDocument>,
    ) => {
      await deletePetitionComment({ variables });
    },
    [deletePetitionComment],
  );
}

const _queries = {
  Users: gql`
    query usePetitionCommentsMutations_getUsersOrGroups($ids: [ID!]!) {
      getUsersOrGroups(ids: $ids) {
        __typename
        ... on User {
          ...UserReference_User
        }
        ... on UserGroup {
          ...UserGroupReference_UserGroup
        }
      }
    }
    ${UserReference.fragments.User}
    ${UserGroupReference.fragments.UserGroup}
  `,
};

const _fragments = {
  PetitionField: gql`
    fragment usePetitionCommentsMutations_PetitionField on PetitionField {
      id
      commentCount
      unreadCommentCount
      comments {
        id
      }
      lastComment {
        id
      }
    }
  `,
  PetitionFieldComment: gql`
    fragment usePetitionCommentsMutations_PetitionFieldComment on PetitionFieldComment {
      id
      ...PetitionFieldComment_PetitionFieldComment
    }
    ${PetitionFieldComment.fragments.PetitionFieldComment}
  `,
};

const _mutations = [
  gql`
    mutation usePetitionCommentsMutations_createPetitionComment(
      $petitionId: GID!
      $petitionFieldId: GID
      $content: JSON!
      $isInternal: Boolean!
      $sharePetition: Boolean
      $sharePetitionPermission: PetitionPermissionTypeRW
      $sharePetitionSubscribed: Boolean
      $throwOnNoPermission: Boolean
    ) {
      createPetitionComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        content: $content
        isInternal: $isInternal
        sharePetition: $sharePetition
        sharePetitionPermission: $sharePetitionPermission
        sharePetitionSubscribed: $sharePetitionSubscribed
        throwOnNoPermission: $throwOnNoPermission
      ) {
        ...usePetitionCommentsMutations_PetitionFieldComment
        field {
          ...usePetitionCommentsMutations_PetitionField
        }
        petition {
          id
          ... on Petition {
            generalCommentCount
            generalComments {
              id
            }
            lastGeneralComment {
              id
            }
          }
        }
      }
    }
    ${_fragments.PetitionFieldComment}
    ${_fragments.PetitionField}
  `,
  gql`
    mutation usePetitionCommentsMutations_updatePetitionComment(
      $petitionId: GID!
      $petitionFieldCommentId: GID!
      $content: JSON!
      $sharePetition: Boolean
      $sharePetitionPermission: PetitionPermissionTypeRW
      $sharePetitionSubscribed: Boolean
      $throwOnNoPermission: Boolean
    ) {
      updatePetitionComment(
        petitionId: $petitionId
        petitionFieldCommentId: $petitionFieldCommentId
        content: $content
        sharePetition: $sharePetition
        sharePetitionPermission: $sharePetitionPermission
        sharePetitionSubscribed: $sharePetitionSubscribed
        throwOnNoPermission: $throwOnNoPermission
      ) {
        ...usePetitionCommentsMutations_PetitionFieldComment
        field {
          ...usePetitionCommentsMutations_PetitionField
        }
        petition {
          id
          ... on Petition {
            generalComments {
              id
            }
          }
        }
      }
    }
    ${_fragments.PetitionFieldComment}
    ${_fragments.PetitionField}
  `,
  gql`
    mutation usePetitionCommentsMutations_deletePetitionComment(
      $petitionId: GID!
      $petitionFieldCommentId: GID!
    ) {
      deletePetitionComment(
        petitionId: $petitionId
        petitionFieldCommentId: $petitionFieldCommentId
      ) {
        ... on PetitionField {
          ...usePetitionCommentsMutations_PetitionField
        }
        ... on Petition {
          id
          generalCommentCount
          lastGeneralComment {
            id
          }
          generalComments {
            id
          }
        }
      }
    }
    ${_fragments.PetitionField}
  `,
];
