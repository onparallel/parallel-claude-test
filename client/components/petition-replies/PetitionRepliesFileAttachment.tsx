import { gql } from "@apollo/client";
import { Button, Flex, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionRepliesFileAttachment_PetitionAttachmentFileUploadFragment } from "@parallel/graphql/__types";

import { useIntl } from "react-intl";
import { FileIcon } from "../common/FileIcon";
import { FileName } from "../common/FileName";
import { FileSize } from "../common/FileSize";

interface PetitionRepliesFileAttachmentProps {
  file: PetitionRepliesFileAttachment_PetitionAttachmentFileUploadFragment;
}

export const PetitionRepliesFileAttachment = Object.assign(
  chakraForwardRef<"button", PetitionRepliesFileAttachmentProps>(
    function PetitionRepliesFileAttachment({ file, ...props }, ref) {
      const intl = useIntl();
      return (
        <Button
          ref={ref as any}
          variant="outline"
          backgroundColor="white"
          height={8}
          alignItems="center"
          isDisabled={!file.isComplete}
          aria-label={intl.formatMessage(
            {
              id: "generic.attached-file",
              defaultMessage: "Attached file: {filename}",
            },
            { filename: file.filename }
          )}
          {...props}
        >
          <FileIcon boxSize="18px" filename={file.filename} contentType={file.contentType} />
          <Flex marginX={2}>
            <FileName
              as="div"
              value={file.filename}
              fontSize="sm"
              fontWeight="500"
              maxWidth="200px"
            />
            <Text as="span" fontSize="sm" color="gray.500" marginLeft={1} whiteSpace="nowrap">
              (<FileSize value={file.size} />)
            </Text>
          </Flex>
        </Button>
      );
    }
  ),
  {
    fragments: {
      FileUpload: gql`
        fragment PetitionRepliesFileAttachment_PetitionAttachmentFileUpload on FileUpload {
          filename
          contentType
          size
          isComplete
        }
      `,
    },
  }
);
