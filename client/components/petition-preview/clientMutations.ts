import { DataProxy, gql, useApolloClient, useMutation } from "@apollo/client";
import {
  PreviewPetitionFieldMutations_createCheckboxReplyDocument,
  PreviewPetitionFieldMutations_createDynamicSelectReplyDocument,
  PreviewPetitionFieldMutations_createFileUploadReplyCompleteDocument,
  PreviewPetitionFieldMutations_createFileUploadReplyDocument,
  PreviewPetitionFieldMutations_createSimpleReplyDocument,
  PreviewPetitionFieldMutations_deletePetitionReplyDocument,
  PreviewPetitionFieldMutations_updateCheckboxReplyDocument,
  PreviewPetitionFieldMutations_updateDynamicSelectReplyDocument,
  PreviewPetitionFieldMutations_updateFieldReplies_PetitionFieldFragment,
  PreviewPetitionFieldMutations_updateFieldReplies_PetitionFieldFragmentDoc,
  PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReplyFragmentDoc,
  PreviewPetitionFieldMutations_updateSimpleReplyDocument,
  Scalars,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { uploadFile } from "@parallel/utils/uploadFile";
import { customAlphabet } from "nanoid";
import { MutableRefObject, useCallback } from "react";
import { RecipientViewPetitionFieldCard } from "../recipient-view/fields/RecipientViewPetitionFieldCard";
import { DynamicSelectValue } from "../recipient-view/fields/RecipientViewPetitionFieldDynamicSelect";

function getRandomId() {
  const nanoid = customAlphabet("1234567890abcdefgihjklmnopqrstvwxyz", 6);
  return nanoid();
}

const _deletePetitionReply = gql`
  mutation PreviewPetitionFieldMutations_deletePetitionReply($petitionId: GID!, $replyId: GID!) {
    deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
      id
      petition {
        id
        ... on Petition {
          status
        }
      }
      replies {
        id
      }
    }
  }
`;

export function useDeletePetitionReply() {
  const client = useApolloClient();

  const [deletePetitionReply] = useMutation(
    PreviewPetitionFieldMutations_deletePetitionReplyDocument
  );
  return useCallback(
    async function _deletePetitionReply({
      petitionId,
      fieldId,
      replyId,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      replyId: string;
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        updatePreviewFieldReplies(client, fieldId, (replies) =>
          replies.filter(({ id }) => id !== replyId)
        );
      } else {
        await deletePetitionReply({
          variables: { petitionId, replyId },
        });
      }
    },
    [deletePetitionReply]
  );
}

const _updateSimpleReply = gql`
  mutation PreviewPetitionFieldMutations_updateSimpleReply(
    $petitionId: GID!
    $replyId: GID!
    $reply: String!
  ) {
    updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
      id
      content
      status
      updatedAt
      field {
        id
        petition {
          id
          ... on Petition {
            status
          }
        }
      }
    }
  }
`;

export function useUpdateSimpleReply() {
  const client = useApolloClient();
  const [updateSimpleReply] = useMutation(PreviewPetitionFieldMutations_updateSimpleReplyDocument);
  return useCallback(
    async function _updateSimpleReply({
      petitionId,
      replyId,
      reply,
      isCacheOnly,
    }: {
      petitionId: string;
      replyId: string;
      reply: string;
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        updateReplyContent(client, replyId, (content) => ({
          ...content,
          text: reply,
        }));
      } else {
        await updateSimpleReply({
          variables: {
            petitionId,
            replyId,
            reply,
          },
        });
      }
    },
    [updateSimpleReply]
  );
}

const _createSimpleReply = gql`
  mutation PreviewPetitionFieldMutations_createSimpleReply(
    $petitionId: GID!
    $fieldId: GID!
    $reply: String!
  ) {
    createSimpleReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
      ...RecipientViewPetitionFieldCard_PetitionFieldReply
      field {
        id
        petition {
          id
          ... on Petition {
            status
          }
        }
        replies {
          ...RecipientViewPetitionFieldCard_PetitionFieldReply
        }
      }
    }
  }
  ${RecipientViewPetitionFieldCard.fragments.PetitionFieldReply}
`;

export function useCreateSimpleReply() {
  const client = useApolloClient();

  const [createSimpleReply] = useMutation(PreviewPetitionFieldMutations_createSimpleReplyDocument);
  return useCallback(
    async function _createSimpleReply({
      petitionId,
      fieldId,
      reply,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      reply: string;
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        const id = `${fieldId}-${getRandomId()}`;
        updatePreviewFieldReplies(client, fieldId, (replies) => [
          ...(replies ?? []),
          {
            id,
            __typename: "PetitionFieldReply",
            status: "PENDING",
            content: { text: reply },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
        return { id, __typename: "PetitionFieldReply" };
      } else {
        const { data } = await createSimpleReply({
          variables: {
            petitionId,
            fieldId,
            reply,
          },
        });
        return data?.createSimpleReply;
      }
    },
    [createSimpleReply]
  );
}

const _createCheckboxReply = gql`
  mutation PreviewPetitionFieldMutations_createCheckboxReply(
    $petitionId: GID!
    $fieldId: GID!
    $values: [String!]!
  ) {
    createCheckboxReply(petitionId: $petitionId, fieldId: $fieldId, values: $values) {
      ...RecipientViewPetitionFieldCard_PetitionFieldReply
      field {
        id
        petition {
          id
          ... on Petition {
            status
          }
        }
        replies {
          ...RecipientViewPetitionFieldCard_PetitionFieldReply
        }
      }
    }
  }
  ${RecipientViewPetitionFieldCard.fragments.PetitionFieldReply}
`;

export function useCreateCheckboxReply() {
  const client = useApolloClient();

  const [createCheckboxReply] = useMutation(
    PreviewPetitionFieldMutations_createCheckboxReplyDocument
  );
  return useCallback(
    async function _createCheckboxReply({
      petitionId,
      fieldId,
      values,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      values: string[];
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        const id = `${fieldId}-${getRandomId()}`;
        updatePreviewFieldReplies(client, fieldId, (replies) => [
          ...(replies ?? []),
          {
            id,
            __typename: "PetitionFieldReply",
            status: "PENDING",
            content: { choices: values },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
        return { id, __typename: "PetitionFieldReply" };
      } else {
        const { data } = await createCheckboxReply({
          variables: {
            petitionId,
            fieldId,
            values,
          },
        });
        return data?.createCheckboxReply;
      }
    },
    [createCheckboxReply]
  );
}

const _updateCheckboxReply = gql`
  mutation PreviewPetitionFieldMutations_updateCheckboxReply(
    $petitionId: GID!
    $replyId: GID!
    $values: [String!]!
  ) {
    updateCheckboxReply(petitionId: $petitionId, replyId: $replyId, values: $values) {
      id
      content
      status
      updatedAt
      field {
        id
        petition {
          id
          ... on Petition {
            status
          }
        }
      }
    }
  }
`;

export function useUpdateCheckboxReply() {
  const client = useApolloClient();

  const [updateCheckboxReply] = useMutation(
    PreviewPetitionFieldMutations_updateCheckboxReplyDocument
  );
  return useCallback(
    async function _updateCheckboxReply({
      petitionId,
      replyId,
      values,
      isCacheOnly,
    }: {
      petitionId: string;
      replyId: string;
      values: string[];
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        updateReplyContent(client, replyId, (content) => ({
          ...content,
          choices: values,
        }));
      } else {
        await updateCheckboxReply({
          variables: {
            petitionId,
            replyId,
            values,
          },
        });
      }
    },
    [updateCheckboxReply]
  );
}

const _createDynamicSelectReply = gql`
  mutation PreviewPetitionFieldMutations_createDynamicSelectReply(
    $petitionId: GID!
    $fieldId: GID!
    $value: [[String]!]!
  ) {
    createDynamicSelectReply(petitionId: $petitionId, fieldId: $fieldId, value: $value) {
      ...RecipientViewPetitionFieldCard_PetitionFieldReply
      field {
        id
        petition {
          id
          ... on Petition {
            status
          }
        }
        replies {
          ...RecipientViewPetitionFieldCard_PetitionFieldReply
        }
      }
    }
  }
  ${RecipientViewPetitionFieldCard.fragments.PetitionFieldReply}
`;

export function useCreateDynamicSelectReply() {
  const client = useApolloClient();

  const [createDynamicSelectReply] = useMutation(
    PreviewPetitionFieldMutations_createDynamicSelectReplyDocument
  );
  return useCallback(
    async function _createDynamicSelectReply({
      petitionId,
      fieldId,
      value,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      value: DynamicSelectValue;
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        const id = `${fieldId}-${getRandomId()}`;
        updatePreviewFieldReplies(client, fieldId, (replies) => [
          ...(replies ?? []),
          {
            id,
            __typename: "PetitionFieldReply",
            status: "PENDING",
            content: { columns: value },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
        return { id, __typename: "PetitionFieldReply" };
      } else {
        const { data } = await createDynamicSelectReply({
          variables: {
            petitionId,
            fieldId,
            value,
          },
        });
        return data?.createDynamicSelectReply;
      }
    },
    [createDynamicSelectReply]
  );
}

const _updateDynamicSelectReply = gql`
  mutation PreviewPetitionFieldMutations_updateDynamicSelectReply(
    $petitionId: GID!
    $replyId: GID!
    $value: [[String]!]!
  ) {
    updateDynamicSelectReply(petitionId: $petitionId, replyId: $replyId, value: $value) {
      id
      content
      status
      updatedAt
      field {
        id
        petition {
          id
          ... on Petition {
            status
          }
        }
      }
    }
  }
`;

export function useUpdateDynamicSelectReply() {
  const client = useApolloClient();

  const [updateDynamicSelectReply] = useMutation(
    PreviewPetitionFieldMutations_updateDynamicSelectReplyDocument
  );
  return useCallback(
    async function _updateDynamicSelectReply({
      petitionId,
      replyId,
      value,
      isCacheOnly,
    }: {
      petitionId: string;
      replyId: string;
      value: DynamicSelectValue;
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        updateReplyContent(client, replyId, (content) => ({
          ...content,
          columns: value,
        }));
      } else {
        await updateDynamicSelectReply({
          variables: {
            petitionId,
            replyId,
            value,
          },
        });
      }
    },
    [updateDynamicSelectReply]
  );
}

const _createFileUploadReply = gql`
  mutation PreviewPetitionFieldMutations_createFileUploadReply(
    $petitionId: GID!
    $fieldId: GID!
    $file: FileUploadInput!
  ) {
    createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
      presignedPostData {
        ...uploadFile_AWSPresignedPostData
      }
      reply {
        ...RecipientViewPetitionFieldCard_PetitionFieldReply
        field {
          id
          petition {
            id
            ... on Petition {
              status
            }
          }
          replies {
            ...RecipientViewPetitionFieldCard_PetitionFieldReply
          }
        }
      }
    }
  }
  ${uploadFile.fragments.AWSPresignedPostData}
  ${RecipientViewPetitionFieldCard.fragments.PetitionFieldReply}
`;
const _createFileUploadReplyComplete = gql`
  mutation PreviewPetitionFieldMutations_createFileUploadReplyComplete(
    $petitionId: GID!
    $replyId: GID!
  ) {
    createFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
      id
      content
    }
  }
`;

export function useCreateFileUploadReply() {
  const [createFileUploadReply] = useMutation(
    PreviewPetitionFieldMutations_createFileUploadReplyDocument
  );
  const [createFileUploadReplyComplete] = useMutation(
    PreviewPetitionFieldMutations_createFileUploadReplyCompleteDocument
  );
  const apollo = useApolloClient();

  return useCallback(
    async function _createFileUploadReply({
      petitionId,
      fieldId,
      content,
      uploads,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      content: File[];
      uploads: MutableRefObject<Record<string, XMLHttpRequest>>;
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        for (const file of content) {
          const id = `${fieldId}-${getRandomId()}`;
          updatePreviewFieldReplies(apollo, fieldId, (replies) => [
            ...(replies ?? []),
            {
              id,
              __typename: "PetitionFieldReply",
              status: "PENDING",
              content: {
                filename: file.name,
                size: file.size,
                contentType: file.type,
                uploadComplete: true,
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }
      } else {
        for (const file of content) {
          const { data } = await createFileUploadReply({
            variables: {
              petitionId,
              fieldId: fieldId,
              file: {
                filename: file.name,
                size: file.size,
                contentType: file.type,
              },
            },
            update(cache, { data }) {
              const reply = data!.createFileUploadReply.reply;
              updateReplyContent(cache, reply.id, (content) => ({
                ...content,
                progress: 0,
              }));
            },
          });
          const { reply, presignedPostData } = data!.createFileUploadReply;

          uploads.current[reply.id] = uploadFile(file, presignedPostData, {
            onProgress(progress) {
              updateReplyContent(apollo, reply.id, (content) => ({
                ...content,
                progress,
              }));
            },
            async onComplete() {
              delete uploads.current[reply.id];
              await createFileUploadReplyComplete({
                variables: { petitionId, replyId: reply.id },
              });
            },
          });
        }
      }
    },
    [createFileUploadReply, createFileUploadReplyComplete]
  );
}

// CACHE UPDATES

function updatePreviewFieldReplies(
  proxy: DataProxy,
  fieldId: string,
  updateFn: (
    cached: PreviewPetitionFieldMutations_updateFieldReplies_PetitionFieldFragment["previewReplies"]
  ) => PreviewPetitionFieldMutations_updateFieldReplies_PetitionFieldFragment["previewReplies"]
) {
  updateFragment(proxy, {
    id: fieldId,
    fragment: PreviewPetitionFieldMutations_updateFieldReplies_PetitionFieldFragmentDoc,
    fragmentName: "PreviewPetitionFieldMutations_updateFieldReplies_PetitionField",
    data: (cached) => ({
      ...cached,
      replies: [],
      previewReplies: updateFn(cached!.previewReplies),
    }),
  });
}

function updateReplyContent(
  proxy: DataProxy,
  replyId: string,
  updateFn: (cached: Scalars["JSONObject"]) => Scalars["JSONObject"]
) {
  updateFragment(proxy, {
    fragment: PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReplyFragmentDoc,
    id: replyId,
    data: (cached) => ({
      ...cached,
      content: updateFn(cached!.content),
    }),
  });
}

updateReplyContent.fragments = {
  PetitionFieldReply: gql`
    fragment PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReply on PetitionFieldReply {
      content
    }
  `,
};
