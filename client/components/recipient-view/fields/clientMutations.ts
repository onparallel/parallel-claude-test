import { ApolloCache, gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyDocument,
  RecipientViewPetitionFieldMutations_publicDeletePetitionFieldReplyDocument,
  RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteDocument,
  RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragmentDoc,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { UploadFileError, uploadFile } from "@parallel/utils/uploadFile";
import pMap from "p-map";
import { MutableRefObject, useCallback } from "react";
import { RecipientViewPetitionFieldLayout } from "./RecipientViewPetitionFieldLayout";

const _publicCreateFileUploadReply = gql`
  mutation RecipientViewPetitionFieldMutations_publicCreateFileUploadReply(
    $keycode: ID!
    $fieldId: GID!
    $data: FileUploadInput!
    $parentReplyId: GID
    $password: String
  ) {
    publicCreateFileUploadReply(
      keycode: $keycode
      fieldId: $fieldId
      data: $data
      parentReplyId: $parentReplyId
      password: $password
    ) {
      presignedPostData {
        ...uploadFile_AWSPresignedPostData
      }
      reply {
        ...RecipientViewPetitionFieldLayout_PublicPetitionFieldReply
        field {
          id
          petition {
            id
            status
          }
          parent {
            id
            children {
              id
              replies {
                id
              }
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
  ${RecipientViewPetitionFieldLayout.fragments.PublicPetitionFieldReply}
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

const _publicDeletePetitionFieldReply = gql`
  mutation RecipientViewPetitionFieldMutations_publicDeletePetitionFieldReply(
    $replyId: GID!
    $keycode: ID!
  ) {
    publicDeletePetitionFieldReply(replyId: $replyId, keycode: $keycode) {
      id
      replies {
        id
      }
      petition {
        id
        status
      }
    }
  }
`;

export function useCreateFileUploadReply() {
  const [deletePetitionFieldReply] = useMutation(
    RecipientViewPetitionFieldMutations_publicDeletePetitionFieldReplyDocument,
  );
  const [createFileUploadReply] = useMutation(
    RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyDocument,
  );
  const [fileUploadReplyComplete] = useMutation(
    RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteDocument,
  );
  const apollo = useApolloClient();

  return useCallback(
    async function _createFileUploadReply({
      keycode,
      fieldId,
      content,
      uploads,
      parentReplyId,
    }: {
      keycode: string;
      fieldId: string;
      content: { file: File; password?: string }[];
      uploads: MutableRefObject<Record<string, AbortController>>;
      parentReplyId?: string;
    }) {
      await pMap(
        // create file upload replies without concurrency, upload concurrently
        await pMap(
          content,
          async ({ file, password }) => {
            const { data } = await createFileUploadReply({
              variables: {
                keycode,
                fieldId: fieldId,
                data: {
                  filename: file.name,
                  size: file.size,
                  contentType: file.type,
                },
                parentReplyId,
                password,
              },
              update(cache, { data }) {
                const reply = data!.publicCreateFileUploadReply.reply;
                updateReplyContent(cache, reply.id, (content) => ({
                  ...content,
                  progress: 0,
                }));
              },
            });
            const { reply, presignedPostData } = data!.publicCreateFileUploadReply;
            return { file, reply, presignedPostData };
          },
          { concurrency: 1 },
        ),
        async ({ file, reply, presignedPostData }) => {
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
              await deletePetitionFieldReply({
                variables: { keycode, replyId: reply.id },
              });
            }
            return;
          } finally {
            delete uploads.current[reply.id];
          }
          await fileUploadReplyComplete({
            variables: { keycode, replyId: reply.id },
          });
        },
        { concurrency: 5 },
      );
    },
    [createFileUploadReply, fileUploadReplyComplete],
  );
}

function updateReplyContent(
  proxy: ApolloCache,
  replyId: string,
  updateFn: (cached: Record<string, any>) => Record<string, any>,
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
