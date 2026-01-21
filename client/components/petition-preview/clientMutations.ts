import { ApolloCache, gql } from "@apollo/client";
import { useApolloClient, useLazyQuery, useMutation } from "@apollo/client/react";
import {
  PreviewPetitionFieldMutations_createFieldGroupRepliesFromProfilesDocument,
  PreviewPetitionFieldMutations_createFileUploadReplyCompleteDocument,
  PreviewPetitionFieldMutations_createFileUploadReplyDocument,
  PreviewPetitionFieldMutations_createPetitionFieldRepliesDocument,
  PreviewPetitionFieldMutations_deletePetitionReplyDocument,
  PreviewPetitionFieldMutations_prefillPetitionFromProfilesDocument,
  PreviewPetitionFieldMutations_ProfileFragment,
  PreviewPetitionFieldMutations_profilesDocument,
  PreviewPetitionFieldMutations_startAsyncFieldCompletionDocument,
  PreviewPetitionFieldMutations_updatePetitionFieldRepliesDocument,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragment,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragmentDoc,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragment,
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragmentDoc,
  PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReplyFragmentDoc,
  useCreateFieldGroupRepliesFromProfiles_PetitionFieldFragment,
  useCreateFieldGroupRepliesFromProfiles_PetitionFieldFragmentDoc,
  useCreatePetitionFieldReply_PetitionFieldFragment,
  useUpdatePetitionFieldReply_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { uploadFile, UploadFileError } from "@parallel/utils/uploadFile";
import { customAlphabet } from "nanoid";
import pMap from "p-map";
import { MutableRefObject, useCallback } from "react";
import { isNonNullish } from "remeda";

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
        updatePreviewFieldReplies(client.cache, fieldId, (replies) =>
          replies.filter(({ id }) => id !== replyId),
        );
        if (parentReplyId) {
          updatePreviewFieldReply(client.cache, parentReplyId, (reply) => {
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
      const field = client.readFragment<useUpdatePetitionFieldReply_PetitionFieldFragment>({
        fragment: gql`
          fragment useUpdatePetitionFieldReply_PetitionField on PetitionField {
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
        updateReplyContent(client.cache, replyId, (oldContent) => ({
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

// spread all field fragments from Preview and Replies to avoid circular dependencies and missing cache
const _createPetitionFieldReplies = gql`
  mutation PreviewPetitionFieldMutations_createPetitionFieldReplies(
    $petitionId: GID!
    $fields: [CreatePetitionFieldReplyInput!]!
  ) {
    createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
      id
      field {
        id
        ...PetitionReplies_PetitionField
        ...PetitionPreview_PetitionField
      }
    }
  }
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
              multiple
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

        updatePreviewFieldReplies(client.cache, fieldId, (replies) => [
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
          updatePreviewFieldReply(client.cache, parentReplyId, (reply) => {
            return {
              ...(reply ?? {}),
              children: reply?.children?.map((child) => {
                return child.field.id !== fieldId
                  ? child
                  : {
                      ...child,
                      replies: [
                        ...(child.field?.multiple ? child.replies : []),
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
    $password: String
  ) {
    createFileUploadReply(
      petitionId: $petitionId
      fieldId: $fieldId
      file: $file
      parentReplyId: $parentReplyId
      password: $password
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
      omitOldChildReplies,
    }: {
      petitionId: string;
      fieldId: string;
      content: { file: File; password?: string }[];
      uploads: MutableRefObject<Record<string, AbortController>>;
      parentReplyId?: string;
      isCacheOnly?: boolean;
      omitOldChildReplies?: boolean;
    }) {
      if (isCacheOnly) {
        for (const { file } of content) {
          const id = `${fieldId}-${getRandomId()}`;
          updatePreviewFieldReplies(apollo.cache, fieldId, (replies) => [
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
            updatePreviewFieldReply(apollo.cache, parentReplyId, (reply) => {
              return {
                ...(reply ?? {}),
                children: reply?.children?.map((child) => {
                  return child.field.id !== fieldId
                    ? child
                    : {
                        ...child,
                        replies: [
                          ...(omitOldChildReplies ? [] : child.replies),
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
          async ({ file, password }) => {
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
                password,
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
                  updateReplyContent(apollo.cache, reply.id, (content) => ({
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
        updatePreviewFieldReplies(apollo.cache, fieldId, () => [
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
          updatePreviewFieldReply(apollo.cache, parentReplyId, (reply) => {
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
  proxy: ApolloCache,
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
  proxy: ApolloCache,
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

export function cleanPreviewFieldReplies(proxy: ApolloCache, fieldId: string) {
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

const _fragmentsUpdatePreviewFieldReplies = {
  PetitionFieldReply: gql`
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
          multiple
          replies {
            id
          }
        }
        replies {
          id
        }
      }
    }
  `,
  PetitionField: gql`
    fragment PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionField on PetitionField {
      previewReplies @client {
        ...PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReply
      }
      replies {
        ...PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReply
      }
    }
  `,
};

function updateReplyContent(
  proxy: ApolloCache,
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

const _fragmentsUpdateReplyContent = {
  PetitionFieldReply: gql`
    fragment PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReply on PetitionFieldReply {
      content
    }
  `,
};

export function useCreateFieldGroupRepliesFromProfiles() {
  const client = useApolloClient();

  const [createFieldGroupRepliesFromProfiles] = useMutation(
    PreviewPetitionFieldMutations_createFieldGroupRepliesFromProfilesDocument,
  );
  const createPetitionFieldReply = useCreatePetitionFieldReply();

  const [getProfiles] = useLazyQuery(PreviewPetitionFieldMutations_profilesDocument, {
    fetchPolicy: "cache-and-network",
  });

  const createFieldReply = useCreatePetitionFieldReply();
  const createFileUploadReply = useCreateFileUploadReply();

  return useCallback(
    async function _createFieldGroupRepliesFromProfiles({
      petitionId,
      petitionFieldId,
      profileTypeId,
      parentReplyId,
      profileIds,
      force,
      isCacheOnly,
      profiles,
      skipFormatErrors,
    }: {
      petitionId: string;
      petitionFieldId: string;
      profileTypeId: string;
      parentReplyId?: string;
      profileIds: string[];
      force?: boolean;
      isCacheOnly?: boolean;
      profiles?: PreviewPetitionFieldMutations_ProfileFragment[];
      skipFormatErrors?: boolean;
    }) {
      if (isCacheOnly) {
        let _profiles = [];

        if (!profiles) {
          const { data } = await getProfiles({
            variables: {
              profileTypeId,
              filter: { property: "id", operator: "IS_ONE_OF", value: profileIds },
            },
          });
          _profiles = data?.profiles.items ?? [];
        } else {
          _profiles = profiles;
        }

        for (const profileId of profileIds) {
          const field =
            client.readFragment<useCreateFieldGroupRepliesFromProfiles_PetitionFieldFragment>({
              fragment: useCreateFieldGroupRepliesFromProfiles_PetitionFieldFragmentDoc,
              id: petitionFieldId,
            });
          const linkedFields =
            field?.children?.filter((field) => isNonNullish(field.profileTypeField)) ?? [];

          let groupId = parentReplyId;

          if (!groupId) {
            const emptyGroup = field?.previewReplies.find((reply) => {
              return reply?.children?.every((child) => {
                return child.replies.length === 0;
              });
            });

            groupId =
              emptyGroup?.id ??
              (
                await createPetitionFieldReply({
                  petitionId,
                  fieldId: petitionFieldId,
                  content: { profileId },
                  parentReplyId,
                  isCacheOnly,
                })
              )?.id;
          }

          const profile = _profiles.find((profile) => profile.id === profileId);
          for (const linkedField of linkedFields) {
            const property = profile?.properties.find((property) => {
              return property.field.id === linkedField.profileTypeField!.id;
            });
            if (!property) continue;

            if (
              isFileTypeField(linkedField.type) &&
              isNonNullish(property.files) &&
              property.files.length > 0
            ) {
              await createFileUploadReply({
                petitionId,
                fieldId: linkedField.id,
                content: (property!.files?.map((f) => {
                  const { filename, size, contentType } = f.file ?? {};
                  return { file: { name: filename, size, type: contentType } };
                }) ?? []) as { file: File }[],
                uploads: { current: {} },
                parentReplyId: groupId,
                isCacheOnly,
                omitOldChildReplies: true,
              });
            } else if (isNonNullish(property.value)) {
              await createFieldReply({
                petitionId,
                fieldId: linkedField.id,
                content: property!.value?.content ?? { value: null },
                parentReplyId: groupId,
                isCacheOnly,
              });
            }
          }
        }
      } else {
        await createFieldGroupRepliesFromProfiles({
          variables: {
            petitionId,
            petitionFieldId,
            parentReplyId,
            profileIds,
            force,
            skipFormatErrors,
          },
        });
      }
    },
    [createFieldGroupRepliesFromProfiles],
  );
}

const _fragments = {
  PetitionField: gql`
    fragment useCreateFieldGroupRepliesFromProfiles_PetitionField on PetitionField {
      id
      children {
        id
        type
        profileTypeField {
          id
        }
      }
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
      previewReplies @client {
        id
        children {
          replies {
            id
          }
        }
      }
    }
  `,
};

export function usePrefillPetitionFromProfiles() {
  const [prefillPetitionFromProfiles] = useMutation(
    PreviewPetitionFieldMutations_prefillPetitionFromProfilesDocument,
  );

  const [getProfiles] = useLazyQuery(PreviewPetitionFieldMutations_profilesDocument, {
    fetchPolicy: "cache-and-network",
  });

  const createFieldGroupRepliesFromProfiles = useCreateFieldGroupRepliesFromProfiles();

  return useCallback(
    async function _prefillPetitionFromProfiles({
      petitionId,
      parentReplyId,
      profileTypeId,
      prefill,
      force,
      isCacheOnly,
      skipFormatErrors,
    }: {
      petitionId: string;
      parentReplyId?: string;
      profileTypeId: string;
      prefill: {
        petitionFieldId: string;
        profileIds: string[];
      }[];
      force?: boolean;
      isCacheOnly?: boolean;
      skipFormatErrors?: boolean;
    }) {
      if (isCacheOnly) {
        const allProfileIds = prefill.flatMap(({ profileIds }) => profileIds);
        const { data } = await getProfiles({
          variables: {
            profileTypeId,
            filter: { property: "id", operator: "IS_ONE_OF", value: allProfileIds },
          },
        });

        for (const { petitionFieldId, profileIds } of prefill) {
          await createFieldGroupRepliesFromProfiles({
            petitionId,
            petitionFieldId,
            profileTypeId,
            profileIds,
            force,
            isCacheOnly,
            profiles: data?.profiles.items.filter((profile) => profileIds.includes(profile.id)),
          });
        }
      } else {
        await prefillPetitionFromProfiles({
          variables: {
            petitionId,
            parentReplyId,
            prefill,
            force,
            skipFormatErrors,
          },
        });
      }
    },
    [prefillPetitionFromProfiles],
  );
}

const _prefillPetitionFromProfiles = gql`
  mutation PreviewPetitionFieldMutations_prefillPetitionFromProfiles(
    $petitionId: GID!
    $parentReplyId: GID
    $prefill: [CreatePetitionFromProfilePrefillInput!]!
    $force: Boolean
    $skipFormatErrors: Boolean
  ) {
    prefillPetitionFromProfiles(
      petitionId: $petitionId
      parentReplyId: $parentReplyId
      prefill: $prefill
      force: $force
      skipFormatErrors: $skipFormatErrors
    ) {
      id
      fields {
        ...useCreateFieldGroupRepliesFromProfiles_PetitionField
      }
    }
  }
`;

const _createFieldGroupRepliesFromProfiles = gql`
  mutation PreviewPetitionFieldMutations_createFieldGroupRepliesFromProfiles(
    $petitionId: GID!
    $petitionFieldId: GID!
    $parentReplyId: GID
    $profileIds: [GID!]!
    $force: Boolean
    $skipFormatErrors: Boolean
  ) {
    createFieldGroupRepliesFromProfiles(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      parentReplyId: $parentReplyId
      profileIds: $profileIds
      force: $force
      skipFormatErrors: $skipFormatErrors
    ) {
      ...useCreateFieldGroupRepliesFromProfiles_PetitionField
    }
  }
`;

const _getProfilesFragment = {
  Profile: gql`
    fragment PreviewPetitionFieldMutations_Profile on Profile {
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
  `,
};

const _getProfile = gql`
  query PreviewPetitionFieldMutations_profiles(
    $filter: ProfileQueryFilterInput
    $profileTypeId: GID!
  ) {
    profiles(offset: 0, limit: 100, filter: $filter, profileTypeId: $profileTypeId) {
      items {
        ...PreviewPetitionFieldMutations_Profile
      }
    }
  }
  ${_getProfilesFragment.Profile}
`;
