import { gql, useMutation } from "@apollo/client";
import { VariablesOf } from "@graphql-typed-document-node/core";
import { PetitionFieldComment } from "@parallel/components/common/PetitionFieldComment";
import { removeMentionInputElements } from "@parallel/components/common/slate/CommentEditor";
import {
  usePetitionCommentsMutations_createPetitionFieldCommentDocument,
  usePetitionCommentsMutations_deletePetitionFieldCommentDocument,
  usePetitionCommentsMutations_updatePetitionFieldCommentDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";

export function useCreatePetitionFieldComment() {
  const [createPetitionFieldComment] = useMutation(
    usePetitionCommentsMutations_createPetitionFieldCommentDocument
  );

  return useCallback(
    async ({
      content,
      ...variables
    }: VariablesOf<typeof usePetitionCommentsMutations_createPetitionFieldCommentDocument>) => {
      await createPetitionFieldComment({
        variables: { content: removeMentionInputElements(content), ...variables },
      });
    },
    [createPetitionFieldComment]
  );
}

export function useUpdatePetitionFieldComment() {
  const [updatePetitionFieldComment] = useMutation(
    usePetitionCommentsMutations_updatePetitionFieldCommentDocument
  );
  return useCallback(
    async ({
      content,
      ...variables
    }: VariablesOf<typeof usePetitionCommentsMutations_updatePetitionFieldCommentDocument>) => {
      await updatePetitionFieldComment({
        variables: { content: removeMentionInputElements(content), ...variables },
      });
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
    ) {
      createPetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        content: $content
        isInternal: $isInternal
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
    ) {
      updatePetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
        content: $content
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
