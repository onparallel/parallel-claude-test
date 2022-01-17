import { DataProxy, gql, useApolloClient, useMutation } from "@apollo/client";
import {
  RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyDocument,
  RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteDocument,
  RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragmentDoc,
  Scalars,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { uploadFile } from "@parallel/utils/uploadFile";
import { MutableRefObject, useCallback } from "react";
import { RecipientViewPetitionFieldCard } from "./RecipientViewPetitionFieldCard";

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
        field {
          id
          petition {
            id
            status
          }
          replies {
            id
          }
        }
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
      keycode,
      fieldId,
      content,
      uploads,
    }: {
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
            updateReplyContent(cache, reply.id, (content) => ({
              ...content,
              progress: 0,
            }));
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
