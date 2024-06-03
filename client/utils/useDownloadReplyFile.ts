import { gql, useMutation } from "@apollo/client";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition-replies/dialogs/FailureGeneratingLinkDialog";
import {
  PetitionFieldReply,
  useDownloadReplyFile_fileUploadReplyDownloadLinkDocument,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useCallback } from "react";

export function useDownloadReplyFile() {
  const [fileUploadReplyDownloadLink] = useMutation(
    useDownloadReplyFile_fileUploadReplyDownloadLinkDocument,
  );
  const showFailure = useFailureGeneratingLinkDialog();
  return useCallback(
    async function downloadReplyFile(
      petitionId: string,
      reply: Pick<PetitionFieldReply, "id" | "content">,
      preview: boolean,
    ) {
      await withError(
        openNewWindow(async () => {
          const { data } = await fileUploadReplyDownloadLink({
            variables: { petitionId, replyId: reply.id, preview },
          });
          const { url, result } = data!.fileUploadReplyDownloadLink;
          if (result !== "SUCCESS") {
            await withError(showFailure({ filename: reply.content.filename }));
            throw new Error();
          }
          return url!;
        }),
      );
    },
    [fileUploadReplyDownloadLink],
  );
}

const _mutations = [
  gql`
    mutation useDownloadReplyFile_fileUploadReplyDownloadLink(
      $petitionId: GID!
      $replyId: GID!
      $preview: Boolean
    ) {
      fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId, preview: $preview) {
        result
        url
      }
    }
  `,
];
