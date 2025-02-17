import { gql } from "@apollo/client";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionComposeFieldAttachment_PetitionFieldAttachmentFragment } from "@parallel/graphql/__types";
import { FileAttachment } from "../common/FileAttachment";

interface PetitionComposeFieldAttachmentProps {
  progress?: number;
  attachment: PetitionComposeFieldAttachment_PetitionFieldAttachmentFragment;
  onDownload: () => void;
  onRemove: () => void;
  isDisabled?: boolean;
}

export const PetitionComposeFieldAttachment = Object.assign(
  chakraForwardRef<"div", PetitionComposeFieldAttachmentProps>(
    function PetitionComposeFieldAttachment(
      { progress, attachment, onDownload, onRemove, isDisabled, ...props },
      ref,
    ) {
      const uploadHasFailed = !attachment.isUploading && !attachment.file.isComplete;

      return (
        <FileAttachment
          ref={ref}
          filename={attachment.file.filename}
          contentType={attachment.file.contentType}
          size={attachment.file.size}
          isComplete={attachment.file.isComplete}
          isDisabled={isDisabled}
          onDownload={onDownload}
          onRemove={onRemove}
          uploadHasFailed={uploadHasFailed}
        />
      );
    },
  ),
  {
    fragments: {
      PetitionFieldAttachment: gql`
        fragment PetitionComposeFieldAttachment_PetitionFieldAttachment on PetitionFieldAttachment {
          id
          file {
            filename
            contentType
            size
            isComplete
          }
          isUploading @client
        }
      `,
    },
  },
);
