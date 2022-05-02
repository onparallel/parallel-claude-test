import { DataProxy, gql, useApolloClient, useMutation } from "@apollo/client";
import {
  PreviewPetitionFieldMutations_createFileUploadReplyCompleteDocument,
  PreviewPetitionFieldMutations_createFileUploadReplyDocument,
  PreviewPetitionFieldMutations_createPetitionFieldReplyDocument,
  PreviewPetitionFieldMutations_deletePetitionReplyDocument,
  PreviewPetitionFieldMutations_startAsyncFieldCompletionDocument,
  PreviewPetitionFieldMutations_updatePetitionFieldReplyDocument,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragment,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragmentDoc,
  PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReplyFragmentDoc,
  Scalars,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { uploadFile } from "@parallel/utils/uploadFile";
import { customAlphabet } from "nanoid";
import { MutableRefObject, useCallback } from "react";
import { RecipientViewPetitionFieldCard } from "../recipient-view/fields/RecipientViewPetitionFieldCard";

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

const _updatePetitionFieldReply = gql`
  mutation PreviewPetitionFieldMutations_updatePetitionFieldReply(
    $petitionId: GID!
    $replyId: GID!
    $reply: JSON!
  ) {
    updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
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

export function useUpdatePetitionFieldReply() {
  const client = useApolloClient();
  const [updatePetitionFieldReply] = useMutation(
    PreviewPetitionFieldMutations_updatePetitionFieldReplyDocument
  );
  return useCallback(
    async function _updatePetitionFieldReply({
      petitionId,
      replyId,
      reply,
      isCacheOnly,
    }: {
      petitionId: string;
      replyId: string;
      reply: any;
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        updateReplyContent(client, replyId, (content) => ({
          ...content,
          value: reply,
        }));
      } else {
        await updatePetitionFieldReply({
          variables: {
            petitionId,
            replyId,
            reply,
          },
        });
      }
    },
    [updatePetitionFieldReply]
  );
}

const _createPetitionFieldReply = gql`
  mutation PreviewPetitionFieldMutations_createPetitionFieldReply(
    $petitionId: GID!
    $fieldId: GID!
    $reply: JSON!
  ) {
    createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
          id
        }
      }
    }
  }
  ${RecipientViewPetitionFieldCard.fragments.PetitionFieldReply}
`;

export function useCreatePetitionFieldReply() {
  const client = useApolloClient();

  const [createPetitionFieldReply] = useMutation(
    PreviewPetitionFieldMutations_createPetitionFieldReplyDocument
  );
  return useCallback(
    async function _createPetitionFieldReply({
      petitionId,
      fieldId,
      reply,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      reply: any;
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
            content: { value: reply },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
        return { id, __typename: "PetitionFieldReply" };
      } else {
        const { data } = await createPetitionFieldReply({
          variables: {
            petitionId,
            fieldId,
            reply,
          },
        });
        return data?.createPetitionFieldReply;
      }
    },
    [createPetitionFieldReply]
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
            id
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

const _startAsyncFieldCompletion = gql`
  mutation PreviewPetitionFieldMutations_startAsyncFieldCompletion(
    $petitionId: GID!
    $fieldId: GID!
  ) {
    startAsyncFieldCompletion(petitionId: $petitionId, fieldId: $fieldId) {
      type
      url
    }
  }
`;

export function useStartAsyncFieldCompletion() {
  const [startAsyncFieldCompletion] = useMutation(
    PreviewPetitionFieldMutations_startAsyncFieldCompletionDocument
  );

  const apollo = useApolloClient();

  return useCallback(
    async function _startAsyncFieldCompletion({
      petitionId,
      fieldId,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        const id = `${fieldId}-${getRandomId()}`;
        updatePreviewFieldReplies(apollo, fieldId, () => [
          {
            id,
            __typename: "PetitionFieldReply",
            status: "PENDING",
            content: {
              filename: "DatosFiscales.pdf",
              size: 25000,
              contentType: "application/pdf",
              uploadComplete: true,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
        return { type: "CACHE", url: "" };
      } else {
        const { data } = await startAsyncFieldCompletion({
          variables: { petitionId, fieldId: fieldId },
        });
        return data!.startAsyncFieldCompletion;
      }
    },
    [startAsyncFieldCompletion]
  );
}

// CACHE UPDATES

function updatePreviewFieldReplies(
  proxy: DataProxy,
  fieldId: string,
  updateFn: (
    cached: PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragment["previewReplies"]
  ) => PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragment["previewReplies"]
) {
  updateFragment(proxy, {
    id: fieldId,
    fragment: PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragmentDoc,
    fragmentName: "PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionField",
    data: (cached) => ({
      ...cached,
      replies: [],
      previewReplies: updateFn(cached!.previewReplies),
    }),
  });
}

export function cleanPreviewFieldReplies(proxy: DataProxy, fieldId: string) {
  updateFragment(proxy, {
    id: fieldId,
    fragment: PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragmentDoc,
    fragmentName: "PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionField",
    data: (cached) => ({
      ...cached,
      replies: [],
      previewReplies: [],
    }),
  });
}

updatePreviewFieldReplies.fragments = {
  get PetitionFieldReply() {
    return gql`
      fragment PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReply on PetitionFieldReply {
        id
        content
        status
        createdAt
        updatedAt
      }
    `;
  },
  get PetitionField() {
    return gql`
      fragment PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionField on PetitionField {
        previewReplies @client {
          ...PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReply
        }
        replies {
          ...PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReply
        }
      }
      ${this.PetitionFieldReply}
    `;
  },
};

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
