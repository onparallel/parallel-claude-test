import { DataProxy, gql, useApolloClient, useMutation } from "@apollo/client";
import {
  RecipientViewPetitionFieldMutations_publicCreateCheckboxReplyDocument,
  RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyDocument,
  RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyDocument,
  RecipientViewPetitionFieldMutations_publicCreateSimpleReplyDocument,
  RecipientViewPetitionFieldMutations_publicDeletePetitionReplyDocument,
  RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteDocument,
  RecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyDocument,
  RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyDocument,
  RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyDocument,
  RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragmentDoc,
  RecipientViewPetitionFieldMutations_updatePetitionStatus_PublicPetitionFragmentDoc,
  RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragmentDoc,
  Scalars,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { uploadFile } from "@parallel/utils/uploadFile";
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
  const [deletePetitionReply] = useMutation(
    RecipientViewPetitionFieldMutations_publicDeletePetitionReplyDocument,
    { optimisticResponse: { publicDeletePetitionReply: "SUCCESS" } }
  );
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
    $value: String!
  ) {
    publicUpdateSimpleReply(keycode: $keycode, replyId: $replyId, value: $value) {
      id
      content
      status
      updatedAt
    }
  }
`;

export function useUpdateSimpleReply() {
  const [updateSimpleReply] = useMutation(
    RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyDocument
  );
  return useCallback(
    async function _updateSimpleReply({
      petitionId,
      keycode,
      replyId,
      value,
    }: {
      petitionId: string;
      keycode: string;
      replyId: string;
      value: string;
    }) {
      await updateSimpleReply({
        variables: {
          keycode,
          replyId,
          value,
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
    $value: String!
  ) {
    publicCreateSimpleReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
      ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
    }
  }
  ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
`;

export function useCreateSimpleReply() {
  const [createSimpleReply] = useMutation(
    RecipientViewPetitionFieldMutations_publicCreateSimpleReplyDocument
  );
  return useCallback(
    async function _createSimpleReply({
      petitionId,
      keycode,
      fieldId,
      value,
    }: {
      petitionId: string;
      keycode: string;
      fieldId: string;
      value: string;
    }) {
      const { data } = await createSimpleReply({
        variables: {
          keycode,
          fieldId,
          value,
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

const _publicCreateCheckboxReply = gql`
  mutation RecipientViewPetitionFieldMutations_publicCreateCheckboxReply(
    $keycode: ID!
    $fieldId: GID!
    $values: [String!]!
  ) {
    publicCreateCheckboxReply(keycode: $keycode, fieldId: $fieldId, values: $values) {
      ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
    }
  }
  ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
`;

export function useCreateCheckboxReply() {
  const [createCheckboxReply] = useMutation(
    RecipientViewPetitionFieldMutations_publicCreateCheckboxReplyDocument
  );
  return useCallback(
    async function _createCheckboxReply({
      petitionId,
      keycode,
      fieldId,
      values,
    }: {
      petitionId: string;
      keycode: string;
      fieldId: string;
      values: string[];
    }) {
      const { data } = await createCheckboxReply({
        variables: {
          keycode,
          fieldId,
          values,
        },
        update(cache, { data }) {
          updateFieldReplies(cache, fieldId, (replies) => [
            ...replies,
            pick(data!.publicCreateCheckboxReply, ["id", "__typename"]),
          ]);
          if (data) {
            updatePetitionStatus(cache, petitionId);
          }
        },
      });
      return data?.publicCreateCheckboxReply;
    },
    [createCheckboxReply]
  );
}

const _publicUpdateCheckboxReply = gql`
  mutation RecipientViewPetitionFieldMutations_publicUpdateCheckboxReply(
    $keycode: ID!
    $replyId: GID!
    $values: [String!]!
  ) {
    publicUpdateCheckboxReply(keycode: $keycode, replyId: $replyId, values: $values) {
      id
      content
      status
      updatedAt
    }
  }
`;

export function useUpdateCheckboxReply() {
  const [updateCheckboxReply] = useMutation(
    RecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyDocument
  );
  return useCallback(
    async function _updateCheckboxReply({
      petitionId,
      keycode,
      replyId,
      values,
    }: {
      petitionId: string;
      keycode: string;
      replyId: string;
      values: string[];
    }) {
      await updateCheckboxReply({
        variables: {
          keycode,
          replyId,
          values,
        },
        update(cache, { data }) {
          if (data) {
            updatePetitionStatus(cache, petitionId);
          }
        },
      });
    },
    [updateCheckboxReply]
  );
}

const _publicCreateDynamicSelectReply = gql`
  mutation RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReply(
    $keycode: ID!
    $fieldId: GID!
    $value: [[String]!]!
  ) {
    publicCreateDynamicSelectReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
      ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
    }
  }
  ${RecipientViewPetitionFieldCard.fragments.PublicPetitionFieldReply}
`;

export function useCreateDynamicSelectReply() {
  const [createDynamicSelectReply] = useMutation(
    RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyDocument
  );
  return useCallback(
    async function _createDynamicSelectReply({
      petitionId,
      keycode,
      fieldId,
      value,
    }: {
      petitionId: string;
      keycode: string;
      fieldId: string;
      value: [string, string | null][];
    }) {
      const { data } = await createDynamicSelectReply({
        variables: {
          keycode,
          fieldId,
          value,
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
    $value: [[String]!]!
  ) {
    publicUpdateDynamicSelectReply(keycode: $keycode, replyId: $replyId, value: $value) {
      id
      content
      status
      updatedAt
    }
  }
`;

export function useUpdateDynamicSelectReply() {
  const [updateDynamicSelectReply] = useMutation(
    RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyDocument
  );
  return useCallback(
    async function _updateDynamicSelectReply({
      petitionId,
      keycode,
      replyId,
      value,
    }: {
      petitionId: string;
      keycode: string;
      replyId: string;
      value: [string, string | null][];
    }) {
      await updateDynamicSelectReply({
        variables: {
          keycode,
          replyId,
          value,
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
    $data: FileUploadInput!
  ) {
    publicCreateFileUploadReply(keycode: $keycode, fieldId: $fieldId, data: $data) {
      presignedPostData {
        ...uploadFile_AWSPresignedPostData
      }
      reply {
        ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
      }
    }
  }
  ${uploadFile.fragments.AWSPresignedPostData}
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

export function useCreateFileUploadReply() {
  const [createFileUploadReply] = useMutation(
    RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyDocument
  );
  const [fileUploadReplyComplete] = useMutation(
    RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteDocument
  );
  const apollo = useApolloClient();

  return useCallback(
    async function _createFileUploadReply({
      petitionId,
      keycode,
      fieldId,
      content,
      uploads,
    }: {
      petitionId: string;
      keycode: string;
      fieldId: string;
      content: File[];
      uploads: MutableRefObject<Record<string, XMLHttpRequest>>;
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
        const { reply, presignedPostData } = data!.publicCreateFileUploadReply;

        uploads.current[reply.id] = uploadFile(file, presignedPostData, {
          onProgress(progress) {
            updateReplyContent(apollo, reply.id, (content) => ({
              ...content,
              progress,
            }));
          },
          async onComplete() {
            delete uploads.current[reply.id];
            await fileUploadReplyComplete({
              variables: { keycode, replyId: reply.id },
            });
          },
        });
      }
    },
    [createFileUploadReply, fileUploadReplyComplete]
  );
}

function updateFieldReplies(
  proxy: DataProxy,
  fieldId: string,
  updateFn: (
    cached: RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragment["replies"]
  ) => RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragment["replies"]
) {
  updateFragment(proxy, {
    id: fieldId,
    fragment: RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragmentDoc,
    data: (cached) => ({ ...cached, replies: updateFn(cached!.replies) }),
  });
}

updateFieldReplies.fragments = {
  PublicPetitionField: gql`
    fragment RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionField on PublicPetitionField {
      replies {
        id
      }
    }
  `,
};
function updateReplyContent(
  proxy: DataProxy,
  replyId: string,
  updateFn: (cached: Scalars["JSONObject"]) => Scalars["JSONObject"]
) {
  updateFragment(proxy, {
    fragment:
      RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragmentDoc,
    id: replyId,
    data: (cached) => ({
      ...cached,
      content: updateFn(cached!.content),
    }),
  });
}

updateReplyContent.fragments = {
  PublicPetitionFieldReply: gql`
    fragment RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReply on PublicPetitionFieldReply {
      content
    }
  `,
};

function updatePetitionStatus(proxy: DataProxy, petitionId: string) {
  updateFragment(proxy, {
    fragment: RecipientViewPetitionFieldMutations_updatePetitionStatus_PublicPetitionFragmentDoc,
    id: petitionId,
    data: (cached) => ({
      ...cached,
      status: cached!.status === "COMPLETED" ? "PENDING" : cached!.status,
    }),
  });
}

updatePetitionStatus.fragments = {
  PublicPetition: gql`
    fragment RecipientViewPetitionFieldMutations_updatePetitionStatus_PublicPetition on PublicPetition {
      status
    }
  `,
};
