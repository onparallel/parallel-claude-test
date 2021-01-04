import { DataProxy, gql, useApolloClient } from "@apollo/client";
import {
  RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment,
  useRecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation,
  useRecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation,
  useRecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation,
  useRecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation,
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
      fieldId,
      replyId,
      keycode,
    }: {
      fieldId: string;
      replyId: string;
      keycode: string;
    }) {
      // if (uploads.current[replyId]) {
      //   uploads.current[replyId].abort();
      //   delete uploads.current[replyId];
      // }
      await deletePetitionReply({
        variables: { replyId, keycode },
        update(cache) {
          updateFieldReplies(cache, fieldId, (replies) =>
            replies.filter(({ id }) => id !== replyId)
          );
          // TODO: update petition status COMPLETED -> PENDING
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
      updatedAt
    }
  }
`;

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
      fieldId,
      keycode,
      content,
    }: {
      fieldId: string;
      keycode: string;
      content: string;
    }) {
      await createSimpleReply({
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
          // TODO: update petition status COMPLETED -> PENDING
        },
      });
    },
    [createSimpleReply]
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
      fieldId,
      keycode,
      content,
    }: {
      fieldId: string;
      keycode: string;
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
            // TODO: update petition status COMPLETED -> PENDING
          },
        });
        const { reply, endpoint } = data!.publicCreateFileUploadReply;

        const form = new FormData();
        form.append("file", file);

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
        request.send(form);
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
  updateFragment<
    RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragment
  >(proxy, {
    id: fieldId,
    fragment: gql`
      fragment RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionField on PublicPetitionField {
        replies {
          id
        }
      }
    `,
    data: (cached) => ({ ...cached, replies: updateFn(cached!.replies) }),
  });
}

function updateReplyContent(
  proxy: DataProxy,
  replyId: string,
  updateFn: (
    cached: RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment["content"]
  ) => RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment["content"]
) {
  updateFragment<
    RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment
  >(proxy, {
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
  });
}
