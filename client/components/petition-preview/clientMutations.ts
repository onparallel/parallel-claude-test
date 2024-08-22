import { DataProxy, gql, useApolloClient, useLazyQuery, useMutation } from "@apollo/client";
import {
  PreviewPetitionFieldMutations_createFieldGroupReplyFromProfileDocument,
  PreviewPetitionFieldMutations_createFileUploadReplyCompleteDocument,
  PreviewPetitionFieldMutations_createFileUploadReplyDocument,
  PreviewPetitionFieldMutations_createPetitionFieldRepliesDocument,
  PreviewPetitionFieldMutations_deletePetitionReplyDocument,
  PreviewPetitionFieldMutations_profileDocument,
  PreviewPetitionFieldMutations_startAsyncFieldCompletionDocument,
  PreviewPetitionFieldMutations_updatePetitionFieldRepliesDocument,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragment,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragmentDoc,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragment,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragmentDoc,
  PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReplyFragmentDoc,
  useCreateFieldGroupReplyFromProfile_PetitionFieldFragment,
  useCreateFieldGroupReplyFromProfile_PetitionFieldFragmentDoc,
  useCreatePetitionFieldReply_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { UploadFileError, uploadFile } from "@parallel/utils/uploadFile";
import { customAlphabet } from "nanoid";
import pMap from "p-map";
import { MutableRefObject, useCallback } from "react";
import { isDefined } from "remeda";
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
      parent {
        id
        replies {
          id
          children {
            field {
              id
            }
            replies {
              id
            }
          }
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
      parentReplyId,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      replyId: string;
      parentReplyId?: string;
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        updatePreviewFieldReplies(client, fieldId, (replies) =>
          replies.filter(({ id }) => id !== replyId),
        );
        if (parentReplyId) {
          updatePreviewFieldReply(client, parentReplyId, (reply) => {
            return {
              ...(reply ?? {}),
              children: reply?.children?.map((child) => {
                return child.field.id !== fieldId
                  ? child
                  : {
                      ...child,
                      replies: child.replies.filter(({ id }) => id !== replyId),
                    };
              }),
            } as PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragment;
          });
        }
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
            children {
              id
              replies {
                id
              }
            }
          }
        `,
        id: fieldId,
      });

      if (isCacheOnly) {
        const { fromZonedTime } = await import("date-fns-tz");
        updateReplyContent(client, replyId, (oldContent) => ({
          ...oldContent,
          ...(field?.type === "DATE_TIME"
            ? {
                ...content,
                value: fromZonedTime(content.datetime, content.timezone).toISOString(),
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
      children {
        field {
          id
        }
      }
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
          parent {
            id
            children {
              field {
                id
              }
              replies {
                id
              }
            }
          }
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
      parentReplyId,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      content: any;
      parentReplyId?: string;
      isCacheOnly?: boolean;
    }) {
      const field = client.readFragment<useCreatePetitionFieldReply_PetitionFieldFragment>({
        fragment: gql`
          fragment useCreatePetitionFieldReply_PetitionField on PetitionField {
            id
            type
            children {
              id
              replies {
                id
              }
            }
          }
        `,
        id: fieldId,
      });

      if (isCacheOnly) {
        const { fromZonedTime } = await import("date-fns-tz");

        const id = `${fieldId}-${getRandomId()}`;

        updatePreviewFieldReplies(client, fieldId, (replies) => [
          ...(replies ?? []),
          {
            id,
            __typename: "PetitionFieldReply",
            children:
              field?.type === "FIELD_GROUP"
                ? field.children?.map((field) => ({
                    field,
                    replies: [],
                    __typename: "PetitionFieldGroupChildReply",
                  }))
                : null,
            status: "PENDING",
            content:
              field?.type === "DATE_TIME"
                ? {
                    ...content,
                    value: fromZonedTime(content.datetime, content.timezone).toISOString(),
                  }
                : content,
            isAnonymized: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parent: parentReplyId ? { id: parentReplyId } : null,
          },
        ]);

        if (parentReplyId) {
          updatePreviewFieldReply(client, parentReplyId, (reply) => {
            return {
              ...(reply ?? {}),
              children: reply?.children?.map((child) => {
                return child.field.id !== fieldId
                  ? child
                  : {
                      ...child,
                      replies: [
                        ...child.replies,
                        {
                          id,
                          __typename: "PetitionFieldReply",
                          status: "PENDING",
                          content:
                            field?.type === "DATE_TIME"
                              ? {
                                  ...content,
                                  value: fromZonedTime(
                                    content.datetime,
                                    content.timezone,
                                  ).toISOString(),
                                }
                              : content,
                          isAnonymized: false,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          parent: { id: parentReplyId },
                        },
                      ],
                    };
              }),
            } as PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragment;
          });
        }

        return { id, __typename: "PetitionFieldReply" };
      } else {
        const { data } = await createPetitionFieldReplies({
          variables: {
            petitionId,
            fields: [{ id: fieldId, content, parentReplyId }],
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
    $parentReplyId: GID
  ) {
    createFileUploadReply(
      petitionId: $petitionId
      fieldId: $fieldId
      file: $file
      parentReplyId: $parentReplyId
    ) {
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
            parent {
              id
              children {
                field {
                  id
                }
                replies {
                  id
                }
              }
            }
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
      parentReplyId,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      content: File[];
      uploads: MutableRefObject<Record<string, AbortController>>;
      parentReplyId?: string;
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
              parent: parentReplyId ? { id: parentReplyId } : null,
            },
          ]);

          if (parentReplyId) {
            updatePreviewFieldReply(apollo, parentReplyId, (reply) => {
              return {
                ...(reply ?? {}),
                children: reply?.children?.map((child) => {
                  return child.field.id !== fieldId
                    ? child
                    : {
                        ...child,
                        replies: [
                          ...child.replies,
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
                            parent: { id: parentReplyId },
                          },
                        ],
                      };
                }),
              } as PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragment;
            });
          }
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
                parentReplyId,
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
    $parentReplyId: GID
  ) {
    startAsyncFieldCompletion(
      petitionId: $petitionId
      fieldId: $fieldId
      parentReplyId: $parentReplyId
    ) {
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
      parentReplyId,
      isCacheOnly,
    }: {
      petitionId: string;
      fieldId: string;
      parentReplyId?: string;
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
            parent: null,
            children: [],
          },
        ]);

        if (parentReplyId) {
          updatePreviewFieldReply(apollo, parentReplyId, (reply) => {
            return {
              ...(reply ?? {}),
              children: reply?.children?.map((child) => {
                return child.field.id !== fieldId
                  ? child
                  : {
                      ...child,
                      replies: [
                        ...child.replies,
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
                          parent: { id: parentReplyId },
                        },
                      ],
                    };
              }),
            } as PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragment;
          });
        }

        return { type: "CACHE", url: "" };
      } else {
        const { data } = await startAsyncFieldCompletion({
          variables: { petitionId, fieldId: fieldId, parentReplyId },
        });
        return data!.startAsyncFieldCompletion;
      }
    },
    [startAsyncFieldCompletion],
  );
}

// CACHE UPDATES

export function updatePreviewFieldReplies(
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

function updatePreviewFieldReply(
  proxy: DataProxy,
  replyId: string,
  updateFn: (
    cached: PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragment | null,
  ) => PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragment,
) {
  updateFragment(proxy, {
    id: replyId,
    fragment: PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragmentDoc,
    fragmentName: "PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReply",
    data: (cached) => updateFn(cached),
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
        parent {
          id
        }
        children {
          field {
            id
            replies {
              id
            }
          }
          replies {
            id
          }
        }
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

const _createFieldGroupReplyFromProfile = gql`
  mutation PreviewPetitionFieldMutations_createFieldGroupReplyFromProfile(
    $petitionId: GID!
    $petitionFieldId: GID!
    $parentReplyId: GID!
    $profileId: GID!
    $force: Boolean
  ) {
    createFieldGroupReplyFromProfile(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      parentReplyId: $parentReplyId
      profileId: $profileId
      force: $force
    ) {
      id
    }
  }
`;

const _getProfile = gql`
  query PreviewPetitionFieldMutations_profile($profileId: GID!) {
    profile(profileId: $profileId) {
      id
      properties {
        field {
          id
        }
        files {
          id
          file {
            size
            isComplete
            filename
            contentType
          }
        }
        value {
          id
          content
        }
      }
    }
  }
`;

export function useCreateFieldGroupReplyFromProfile() {
  const client = useApolloClient();

  const [createFieldGroupReplyFromProfile] = useMutation(
    PreviewPetitionFieldMutations_createFieldGroupReplyFromProfileDocument,
  );

  const [getProfile] = useLazyQuery(PreviewPetitionFieldMutations_profileDocument, {
    fetchPolicy: "cache-and-network",
  });

  const createFieldReply = useCreatePetitionFieldReply();
  const createFileUploadReply = useCreateFileUploadReply();

  return useCallback(
    async function _createFieldGroupReplyFromProfile({
      petitionId,
      petitionFieldId,
      parentReplyId,
      profileId,
      force,
      isCacheOnly,
    }: {
      petitionId: string;
      petitionFieldId: string;
      parentReplyId: string;
      profileId: string;
      force?: boolean;
      isCacheOnly?: boolean;
    }) {
      if (isCacheOnly) {
        const field =
          client.readFragment<useCreateFieldGroupReplyFromProfile_PetitionFieldFragment>({
            fragment: useCreateFieldGroupReplyFromProfile_PetitionFieldFragmentDoc,
            id: petitionFieldId,
          });
        const { data } = await getProfile({ variables: { profileId } });

        const linkedFields =
          field?.children?.filter((field) => isDefined(field.profileTypeField)) ?? [];

        for (const linkedField of linkedFields) {
          const property = data?.profile?.properties.find((property) => {
            return property.field.id === linkedField.profileTypeField!.id;
          });
          if (!property) continue;

          if (isFileTypeField(linkedField.type) && property.files) {
            await createFileUploadReply({
              petitionId,
              fieldId: linkedField.id,
              content: (property!.files?.map((f) => {
                const { filename, size, contentType } = f.file ?? {};
                return { name: filename, size, type: contentType };
              }) ?? []) as File[],
              uploads: { current: {} },
              parentReplyId,
              isCacheOnly,
            });
          } else if (property.value) {
            await createFieldReply({
              petitionId,
              fieldId: linkedField.id,
              content: property!.value?.content,
              parentReplyId,
              isCacheOnly,
            });
          }
        }
      } else {
        await createFieldGroupReplyFromProfile({
          variables: {
            petitionId,
            petitionFieldId,
            parentReplyId,
            profileId,
            force,
          },
        });
      }
    },
    [createFieldGroupReplyFromProfile],
  );
}

useCreateFieldGroupReplyFromProfile.fragments = {
  PetitionField: gql`
    fragment useCreateFieldGroupReplyFromProfile_PetitionField on PetitionField {
      id
      children {
        id
        type
        profileTypeField {
          id
        }
      }
    }
  `,
};
