import { gql, useMutation } from "@apollo/client";
import { VariablesOf } from "@graphql-typed-document-node/core";
import { useConfirmCommentMentionAndShareDialog } from "@parallel/components/common/dialogs/ConfirmCommentMentionAndShareDialog";
import { PetitionFieldComment } from "@parallel/components/common/PetitionFieldComment";
import { removeMentionInputElements } from "@parallel/components/common/slate/CommentEditor";
import {
  usePetitionCommentsMutations_createPetitionFieldCommentDocument,
  usePetitionCommentsMutations_deletePetitionFieldCommentDocument,
  usePetitionCommentsMutations_updatePetitionFieldCommentDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { isApolloError } from "../apollo/isApolloError";
import { withError } from "../promises/withError";

export function useCreatePetitionFieldComment() {
  const [createPetitionFieldComment] = useMutation(
    usePetitionCommentsMutations_createPetitionFieldCommentDocument
  );

  const showConfirmCommentMentionAndShareDialog = useConfirmCommentMentionAndShareDialog();

  return useCallback(
    async ({
      content,
      ...variables
    }: Omit<
      VariablesOf<typeof usePetitionCommentsMutations_createPetitionFieldCommentDocument>,
      "sharePetition" | "throwOnNoPermission"
    >) => {
      try {
        await createPetitionFieldComment({
          variables: { content: removeMentionInputElements(content), ...variables },
        });
      } catch (e: any) {
        if (isApolloError(e, "NO_PERMISSIONS_MENTION_ERROR")) {
          const names = e.graphQLErrors[0].extensions.names as string[];
          const [error, sharePetition] = await withError(
            showConfirmCommentMentionAndShareDialog({ names })
          );
          if (!error) {
            try {
              await createPetitionFieldComment({
                variables: {
                  content: removeMentionInputElements(content),
                  sharePetition,
                  throwOnNoPermission: false,
                  ...variables,
                },
              });
            } catch {}
          }
        }
      }
    },
    [createPetitionFieldComment]
  );
}

export function useUpdatePetitionFieldComment() {
  const [updatePetitionFieldComment] = useMutation(
    usePetitionCommentsMutations_updatePetitionFieldCommentDocument
  );
  const showConfirmCommentMentionAndShareDialog = useConfirmCommentMentionAndShareDialog();

  return useCallback(
    async ({
      content,
      ...variables
    }: Omit<
      VariablesOf<typeof usePetitionCommentsMutations_updatePetitionFieldCommentDocument>,
      "sharePetition" | "throwOnNoPermission"
    >) => {
      try {
        await updatePetitionFieldComment({
          variables: { content: removeMentionInputElements(content), ...variables },
        });
      } catch (e: any) {
        if (isApolloError(e, "NO_PERMISSIONS_MENTION_ERROR")) {
          const names = e.graphQLErrors[0].extensions.names as string[];
          const [error, sharePetition] = await withError(
            showConfirmCommentMentionAndShareDialog({ names })
          );
          if (!error) {
            try {
              await updatePetitionFieldComment({
                variables: {
                  content: removeMentionInputElements(content),
                  sharePetition,
                  throwOnNoPermission: false,
                  ...variables,
                },
              });
            } catch {}
          }
        }
      }
    },
    [updatePetitionFieldComment]
  );
}

export function useDeletePetitionFieldComment() {
  const [deletePetitionFieldComment] = useMutation(
    usePetitionCommentsMutations_deletePetitionFieldCommentDocument
  );
  return useCallback(
    async (
      variables: VariablesOf<typeof usePetitionCommentsMutations_deletePetitionFieldCommentDocument>
    ) => {
      await deletePetitionFieldComment({ variables });
    },
    [deletePetitionFieldComment]
  );
}

const _fragments = {
  PetitionField: gql`
    fragment usePetitionCommentsMutations_PetitionField on PetitionField {
      id
      commentCount
      unreadCommentCount
      comments {
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
    mutation usePetitionCommentsMutations_createPetitionFieldComment(
      $petitionId: GID!
      $petitionFieldId: GID!
      $content: JSON!
      $isInternal: Boolean
      $sharePetition: Boolean
      $throwOnNoPermission: Boolean
    ) {
      createPetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        content: $content
        isInternal: $isInternal
        sharePetition: $sharePetition
        throwOnNoPermission: $throwOnNoPermission
      ) {
        ...usePetitionCommentsMutations_PetitionFieldComment
        field {
          ...usePetitionCommentsMutations_PetitionField
        }
      }
    }
    ${_fragments.PetitionFieldComment}
    ${_fragments.PetitionField}
  `,
  gql`
    mutation usePetitionCommentsMutations_updatePetitionFieldComment(
      $petitionId: GID!
      $petitionFieldId: GID!
      $petitionFieldCommentId: GID!
      $content: JSON!
      $sharePetition: Boolean
      $throwOnNoPermission: Boolean
    ) {
      updatePetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
        content: $content
        sharePetition: $sharePetition
        throwOnNoPermission: $throwOnNoPermission
      ) {
        ...usePetitionCommentsMutations_PetitionFieldComment
        field {
          ...usePetitionCommentsMutations_PetitionField
        }
      }
    }
    ${_fragments.PetitionFieldComment}
    ${_fragments.PetitionField}
  `,
  gql`
    mutation usePetitionCommentsMutations_deletePetitionFieldComment(
      $petitionId: GID!
      $petitionFieldId: GID!
      $petitionFieldCommentId: GID!
    ) {
      deletePetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
      ) {
        ...usePetitionCommentsMutations_PetitionField
      }
    }
    ${_fragments.PetitionField}
  `,
];
