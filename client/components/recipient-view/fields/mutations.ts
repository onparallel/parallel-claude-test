import { DataProxy, gql, useApolloClient } from "@apollo/client";
import {
  RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldMutations_updatePetitionStatus_PublicPetitionFragment,
  RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment,
  useRecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation,
  useRecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation,
  useRecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation,
  useRecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation,
  useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation,
  useRecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation,
  useRecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { MutableRefObject, useCallback } from "react";
import { pick } from "remeda";
import { RecipientViewPetitionFieldCard } from "./RecipientViewPetitionFieldCard";

const _publicDeletePetitionReply = gql`
  mutation RecipientViewPetitionFieldMutations_publicDeletePetitionReply(
    $replyId: GID!
    $keycode: ID!
  ) {
    publicDeletePetitionReply(replyId: $replyId, keycode: $keycode)
  }
`;

export function useDeletePetitionReply() {
  const [
    deletePetitionReply,
  ] = useRecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation({
    optimisticResponse: { publicDeletePetitionReply: "SUCCESS" },
  });
  return useCallback(
    async function _deletePetitionReply({
      petitionId,
      keycode,
      fieldId,
      replyId,
    }: {
      petitionId: string;
      keycode: string;
      fieldId: string;
      replyId: string;
    }) {
      await deletePetitionReply({
        variables: { replyId, keycode },
        update(cache) {
          updateFieldReplies(cache, fieldId, (replies) =>
            replies.filter(({ id }) => id !== replyId)
          );
          updatePetitionStatus(cache, petitionId);
        },
      });
    },
    [deletePetitionReply]
  );
}

const _publicUpdateSimpleReply = gql`
  mutation RecipientViewPetitionFieldMutations_publicUpdateSimpleReply(
    $keycode: ID!
    $replyId: GID!
    $reply: String!
  ) {
    publicUpdateSimpleReply(
      keycode: $keycode
      replyId: $replyId
      reply: $reply
    ) {
      id
      content
      status
      updatedAt
    }
  }
`;

export function useUpdateSimpleReply() {
  const [
    updateSimpleReply,
  ] = useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation();
  return useCallback(
    async function _updateSimpleReply({
      petitionId,
      keycode,
      replyId,
      content,
    }: {
      petitionId: string;
      keycode: string;
      replyId: string;
      content: string;
    }) {
      await updateSimpleReply({
        variables: {
          keycode,
          replyId,
          reply: content,
        },
        update(cache, { data }) {
          if (data) {
            updatePetitionStatus(cache, petitionId);
          }
        },
      });
    },
    [updateSimpleReply]
  );
}

const _publicCreateSimpleReply = gql`
  mutation RecipientViewPetitionFieldMutations_publicCreateSimpleReply(
    $keycode: ID!
    $fieldId: GID!
    $reply: String!
  ) {
    publicCreateSimpleReply(
      keycode: $keycode
      fieldId: $fieldId
      reply: $reply
    ) {
      ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
    }
  }
  ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
`;

export function useCreateSimpleReply() {
  const [
    createSimpleReply,
  ] = useRecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation();
  return useCallback(
    async function _createSimpleReply({
      petitionId,
      keycode,
      fieldId,
      content,
    }: {
      petitionId: string;
      keycode: string;
      fieldId: string;
      content: string;
    }) {
      const { data } = await createSimpleReply({
        variables: {
          keycode,
          fieldId,
          reply: content,
        },
        update(cache, { data }) {
          updateFieldReplies(cache, fieldId, (replies) => [
            ...replies,
            pick(data!.publicCreateSimpleReply, ["id", "__typename"]),
          ]);
          if (data) {
            updatePetitionStatus(cache, petitionId);
          }
        },
      });
      return data?.publicCreateSimpleReply;
    },
    [createSimpleReply]
  );
}

const _publicCreateDynamicSelectReply = gql`
  mutation RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReply(
    $keycode: ID!
    $fieldId: GID!
    $reply: [String]!
  ) {
    publicCreateDynamicSelectReply(
      keycode: $keycode
      fieldId: $fieldId
      reply: $reply
    ) {
      ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
    }
  }
  ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
`;

export function useCreateDynamicSelectReply() {
  const [
    createDynamicSelectReply,
  ] = useRecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation();
  return useCallback(
    async function _createDynamicSelectReply({
      petitionId,
      keycode,
      fieldId,
      content,
    }: {
      petitionId: string;
      keycode: string;
      fieldId: string;
      content: string[];
    }) {
      const { data } = await createDynamicSelectReply({
        variables: {
          keycode,
          fieldId,
          reply: content,
        },
        update(cache, { data }) {
          updateFieldReplies(cache, fieldId, (replies) => [
            ...replies,
            pick(data!.publicCreateDynamicSelectReply, ["id", "__typename"]),
          ]);
          if (data) {
            updatePetitionStatus(cache, petitionId);
          }
        },
      });
      return data?.publicCreateDynamicSelectReply;
    },
    [createDynamicSelectReply]
  );
}

const _publicUpdateDynamicSelectReply = gql`
  mutation RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReply(
    $keycode: ID!
    $replyId: GID!
    $reply: [[String]!]!
  ) {
    publicUpdateDynamicSelectReply(
      keycode: $keycode
      replyId: $replyId
      reply: $reply
    ) {
      id
      content
      status
      updatedAt
    }
  }
`;

export function useUpdateDynamicSelectReply() {
  const [
    updateDynamicSelectReply,
  ] = useRecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation();
  return useCallback(
    async function _updateDynamicSelectReply({
      petitionId,
      keycode,
      replyId,
      content,
    }: {
      petitionId: string;
      keycode: string;
      replyId: string;
      content: string[][];
    }) {
      await updateDynamicSelectReply({
        variables: {
          keycode,
          replyId,
          reply: content,
        },
        update(cache, { data }) {
          if (data) {
            updatePetitionStatus(cache, petitionId);
          }
        },
      });
    },
    [updateDynamicSelectReply]
  );
}

const _publicCreateFileUploadReply = gql`
  mutation RecipientViewPetitionFieldMutations_publicCreateFileUploadReply(
    $keycode: ID!
    $fieldId: GID!
    $data: CreateFileUploadReplyInput!
  ) {
    publicCreateFileUploadReply(
      keycode: $keycode
      fieldId: $fieldId
      data: $data
    ) {
      endpoint
      reply {
        ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
      }
    }
  }
  ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
`;
const _publicFileUploadReplyComplete = gql`
  mutation RecipientViewPetitionFieldMutations_publicFileUploadReplyComplete(
    $keycode: ID!
    $replyId: GID!
  ) {
    publicFileUploadReplyComplete(keycode: $keycode, replyId: $replyId) {
      id
      content
    }
  }
`;

export function useCreateFileUploadReply(
  uploads: MutableRefObject<Record<string, XMLHttpRequest>>
) {
  const [
    createFileUploadReply,
  ] = useRecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation();
  const apollo = useApolloClient();
  const [
    fileUploadReplyComplete,
  ] = useRecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation();

  return useCallback(
    async function _createFileUploadReply({
      petitionId,
      keycode,
      fieldId,
      content,
    }: {
      petitionId: string;
      keycode: string;
      fieldId: string;
      content: File[];
    }) {
      for (const file of content) {
        const { data } = await createFileUploadReply({
          variables: {
            keycode,
            fieldId: fieldId,
            data: {
              filename: file.name,
              size: file.size,
              contentType: file.type,
            },
          },
          update(cache, { data }) {
            const reply = data!.publicCreateFileUploadReply.reply;
            updateFieldReplies(cache, fieldId, (replies) => [
              ...replies,
              pick(reply, ["id", "__typename"]),
            ]);
            updateReplyContent(cache, reply.id, (content) => ({
              ...content,
              progress: 0,
            }));
            if (data) {
              updatePetitionStatus(cache, petitionId);
            }
          },
        });
        const { reply, endpoint } = data!.publicCreateFileUploadReply;

        const request = new XMLHttpRequest();
        request.open("PUT", endpoint);
        request.setRequestHeader("Content-Type", file.type);
        uploads.current[reply.id] = request;

        request.upload.addEventListener("progress", (e) =>
          updateReplyContent(apollo, reply.id, (content) => ({
            ...content,
            progress: e.loaded / e.total,
          }))
        );
        request.addEventListener("load", async () => {
          delete uploads.current[reply.id];
          await fileUploadReplyComplete({
            variables: { keycode, replyId: reply.id },
          });
        });
        request.send(file);
      }
    },
    [uploads, createFileUploadReply, fileUploadReplyComplete]
  );
}

function updateFieldReplies(
  proxy: DataProxy,
  fieldId: string,
  updateFn: (
    cached: RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragment["replies"]
  ) => RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragment["replies"]
) {
  updateFragment<RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragment>(
    proxy,
    {
      id: fieldId,
      fragment: gql`
        fragment RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionField on PublicPetitionField {
          replies {
            id
          }
        }
      `,
      data: (cached) => ({ ...cached, replies: updateFn(cached!.replies) }),
    }
  );
}

function updateReplyContent(
  proxy: DataProxy,
  replyId: string,
  updateFn: (
    cached: RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment["content"]
  ) => RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment["content"]
) {
  updateFragment<RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment>(
    proxy,
    {
      fragment: gql`
        fragment RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReply on PublicPetitionFieldReply {
          content
        }
      `,
      id: replyId,
      data: (cached) => ({
        ...cached,
        content: updateFn(cached!.content),
      }),
    }
  );
}

function updatePetitionStatus(proxy: DataProxy, petitionId: string) {
  updateFragment<RecipientViewPetitionFieldMutations_updatePetitionStatus_PublicPetitionFragment>(
    proxy,
    {
      fragment: gql`
        fragment RecipientViewPetitionFieldMutations_updatePetitionStatus_PublicPetition on PublicPetition {
          status
        }
      `,
      id: petitionId,
      data: (cached) => ({
        ...cached,
        status: cached!.status === "COMPLETED" ? "PENDING" : cached!.status,
      }),
    }
  );
}
