import { gql } from "@apollo/client";
import { Button, Flex, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionRepliesFileAttachment_PetitionAttachmentFragment,
  PetitionRepliesFileAttachment_PetitionFieldAttachmentFragment,
} from "@parallel/graphql/__types";

import { useIntl } from "react-intl";
import { FileIcon } from "../common/FileIcon";
import { FileName } from "../common/FileName";
import { FileSize } from "../common/FileSize";

interface PetitionRepliesFileAttachmentProps {
  attachment:
    | PetitionRepliesFileAttachment_PetitionFieldAttachmentFragment
    | PetitionRepliesFileAttachment_PetitionAttachmentFragment;
}

export const PetitionRepliesFileAttachment = Object.assign(
  chakraForwardRef<"button", PetitionRepliesFileAttachmentProps>(
    function PetitionRepliesFileAttachment({ attachment, ...props }, ref) {
      const intl = useIntl();
      return (
        <Button
          ref={ref as any}
          variant="outline"
          backgroundColor="white"
          height={8}
          alignItems="center"
          isDisabled={!attachment.file.isComplete}
          aria-label={intl.formatMessage(
            {
              id: "generic.attached-file",
              defaultMessage: "Attached file: {filename}",
            },
            { filename: attachment.file.filename }
          )}
          {...props}
        >
          <FileIcon
            boxSize="18px"
            filename={attachment.file.filename}
            contentType={attachment.file.contentType}
          />
          <Flex marginX={2}>
            <FileName
              as="div"
              value={attachment.file.filename}
              fontSize="sm"
              fontWeight="500"
              maxWidth="200px"
            />
            <Text as="span" fontSize="sm" color="gray.500" marginLeft={1} whiteSpace="nowrap">
              (<FileSize value={attachment.file.size} />)
            </Text>
          </Flex>
        </Button>
      );
    }
  ),
  {
    fragments: {
      PetitionFieldAttachment: gql`
        fragment PetitionRepliesFileAttachment_PetitionFieldAttachment on PetitionFieldAttachment {
          id
          file {
            filename
            contentType
            size
            isComplete
          }
        }
      `,
      PetitionAttachment: gql`
        fragment PetitionRepliesFileAttachment_PetitionAttachment on PetitionAttachment {
          id
          file {
            filename
            contentType
            size
            isComplete
          }
        }
      `,
    },
  }
);
