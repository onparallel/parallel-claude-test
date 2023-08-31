import { DataProxy, gql, useApolloClient, useMutation } from "@apollo/client";
import {
  PreviewPetitionFieldMutations_createFileUploadReplyCompleteDocument,
  PreviewPetitionFieldMutations_createFileUploadReplyDocument,
  PreviewPetitionFieldMutations_createPetitionFieldRepliesDocument,
  PreviewPetitionFieldMutations_deletePetitionReplyDocument,
  PreviewPetitionFieldMutations_startAsyncFieldCompletionDocument,
  PreviewPetitionFieldMutations_updatePetitionFieldRepliesDocument,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragment,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragmentDoc,
  PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReplyFragmentDoc,
  useCreatePetitionFieldReply_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { UploadFileError, uploadFile } from "@parallel/utils/uploadFile";
import { customAlphabet } from "nanoid";
import pMap from "p-map";
import { MutableRefObject, useCallback } from "react";
import { RecipientViewPetitionFieldLayout } from "../recipient-view/fields/RecipientViewPetitionFieldLayout";

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
    PreviewPetitionFieldMutations_deletePetitionReplyDocument,
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
          replies.filter(({ id }) => id !== replyId),
        );
      } else {
        await deletePetitionReply({
          variables: { petitionId, replyId },
        });
      }
    },
    [deletePetitionReply],
  );
}

const _updatePetitionFieldReplies = gql`
  mutation PreviewPetitionFieldMutations_updatePetitionFieldReplies(
    $petitionId: GID!
    $replies: [UpdatePetitionFieldReplyInput!]!
  ) {
    updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
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
  const [updatePetitionFieldReplies] = useMutation(
    PreviewPetitionFieldMutations_updatePetitionFieldRepliesDocument,
  );
  return useCallback(
    async function _updatePetitionFieldReplies({
      petitionId,
      fieldId,
      replyId,
      content,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      replyId: string;
      content: any;
      isCacheOnly?: boolean;
    }) {
      const field = client.readFragment<useCreatePetitionFieldReply_PetitionFieldFragment>({
        fragment: gql`
          fragment useCreatePetitionFieldReply_PetitionField on PetitionField {
            id
            type
          }
        `,
        id: fieldId,
      });

      if (isCacheOnly) {
        const { zonedTimeToUtc } = await import("date-fns-tz");
        updateReplyContent(client, replyId, (oldContent) => ({
          ...oldContent,
          ...(field?.type === "DATE_TIME"
            ? {
                ...content,
                value: zonedTimeToUtc(content.datetime, content.timezone).toISOString(),
              }
            : content),
        }));
      } else {
        await updatePetitionFieldReplies({
          variables: {
            petitionId,
            replies: [
              {
                id: replyId,
                content,
              },
            ],
          },
        });
      }
    },
    [updatePetitionFieldReplies],
  );
}

const _createPetitionFieldReplies = gql`
  mutation PreviewPetitionFieldMutations_createPetitionFieldReplies(
    $petitionId: GID!
    $fields: [CreatePetitionFieldReplyInput!]!
  ) {
    createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
      ...RecipientViewPetitionFieldLayout_PetitionFieldReply
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
  ${RecipientViewPetitionFieldLayout.fragments.PetitionFieldReply}
`;

export function useCreatePetitionFieldReply() {
  const client = useApolloClient();

  const [createPetitionFieldReplies] = useMutation(
    PreviewPetitionFieldMutations_createPetitionFieldRepliesDocument,
  );
  return useCallback(
    async function _createPetitionFieldReplies({
      petitionId,
      fieldId,
      content,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      content: any;
      isCacheOnly?: boolean;
    }) {
      const field = client.readFragment<useCreatePetitionFieldReply_PetitionFieldFragment>({
        fragment: gql`
          fragment useCreatePetitionFieldReply_PetitionField on PetitionField {
            id
            type
          }
        `,
        id: fieldId,
      });

      if (isCacheOnly) {
        const { zonedTimeToUtc } = await import("date-fns-tz");

        const id = `${fieldId}-${getRandomId()}`;
        updatePreviewFieldReplies(client, fieldId, (replies) => [
          ...(replies ?? []),
          {
            id,
            __typename: "PetitionFieldReply",
            status: "PENDING",
            content:
              field?.type === "DATE_TIME"
                ? {
                    ...content,
                    value: zonedTimeToUtc(content.datetime, content.timezone).toISOString(),
                  }
                : content,
            isAnonymized: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
        return { id, __typename: "PetitionFieldReply" };
      } else {
        const { data } = await createPetitionFieldReplies({
          variables: {
            petitionId,
            fields: [{ id: fieldId, content }],
          },
        });
        return data?.createPetitionFieldReplies?.[0];
      }
    },
    [createPetitionFieldReplies],
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
        ...RecipientViewPetitionFieldLayout_PetitionFieldReply
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
  ${RecipientViewPetitionFieldLayout.fragments.PetitionFieldReply}
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
    PreviewPetitionFieldMutations_createFileUploadReplyDocument,
  );
  const [createFileUploadReplyComplete] = useMutation(
    PreviewPetitionFieldMutations_createFileUploadReplyCompleteDocument,
  );
  const [deletePetitionReply] = useMutation(
    PreviewPetitionFieldMutations_deletePetitionReplyDocument,
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
      uploads: MutableRefObject<Record<string, AbortController>>;
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
              isAnonymized: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }
      } else {
        await pMap(
          content,
          async (file) => {
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
            const controller = new AbortController();
            uploads.current[reply.id] = controller;
            try {
              await uploadFile(file, presignedPostData, {
                signal: controller.signal,
                onProgress(progress) {
                  updateReplyContent(apollo, reply.id, (content) => ({
                    ...content,
                    progress,
                  }));
                },
              });
            } catch (e) {
              if (e instanceof UploadFileError && e.message === "Aborted") {
                // handled when aborted
              } else {
                await deletePetitionReply({
                  variables: { petitionId, replyId: reply.id },
                });
              }
              return;
            } finally {
              delete uploads.current[reply.id];
            }
            await createFileUploadReplyComplete({
              variables: { petitionId, replyId: reply.id },
            });
          },
          { concurrency: 3 },
        );
      }
    },
    [createFileUploadReply, createFileUploadReplyComplete],
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
    PreviewPetitionFieldMutations_startAsyncFieldCompletionDocument,
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
            isAnonymized: false,
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
    [startAsyncFieldCompletion],
  );
}

// CACHE UPDATES

function updatePreviewFieldReplies(
  proxy: DataProxy,
  fieldId: string,
  updateFn: (
    cached: PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragment["previewReplies"],
  ) => PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragment["previewReplies"],
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
        isAnonymized
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
  updateFn: (cached: Record<string, any>) => Record<string, any>,
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
