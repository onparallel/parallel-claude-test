import { gql } from "@apollo/client";
import { Button, Flex, Text } from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { RecipientViewFileAttachment_PetitionFieldAttachmentFragment } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { FileIcon } from "../../common/FileIcon";
import { FileName } from "../../common/FileName";
import { FileSize } from "../../common/FileSize";

interface RecipientViewFileAttachmentProps {
  attachment: RecipientViewFileAttachment_PetitionFieldAttachmentFragment;

  hideDownloadIcon?: boolean;
}

export const RecipientViewFileAttachment = Object.assign(
  chakraForwardRef<"button", RecipientViewFileAttachmentProps>(function RecipientViewFileAttachment(
    { attachment, hideDownloadIcon, ...props },
    ref
  ) {
    const intl = useIntl();
    return (
      <Button
        ref={ref as any}
        variant="outline"
        paddingX={2}
        height={8}
        alignItems="center"
        justifyContent="flex-start"
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
            value={attachment.file.filename}
            fontSize="sm"
            fontWeight="500"
            maxWidth="200px"
          />
          <Text as="span" fontSize="sm" color="gray.500" marginLeft={1} whiteSpace="nowrap">
            (<FileSize value={attachment.file.size} />)
          </Text>
        </Flex>
        {!hideDownloadIcon ? <DownloadIcon /> : null}
      </Button>
    );
  }),
  {
    fragments: {
      PetitionFieldAttachment: gql`
        fragment RecipientViewFileAttachment_PetitionFieldAttachment on PetitionFieldAttachment {
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
