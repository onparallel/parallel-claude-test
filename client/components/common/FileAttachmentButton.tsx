import { gql } from "@apollo/client";
import { Button, Flex, Text } from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { FileAttachmentButton_FileUploadFragment } from "@parallel/graphql/__types";

import { useIntl } from "react-intl";
import { FileIcon } from "./FileIcon";
import { FileName } from "./FileName";
import { FileSize } from "./FileSize";

interface FileAttachmentButtonProps {
  file: FileAttachmentButton_FileUploadFragment;
  showDownloadIcon?: boolean;
}

export const FileAttachmentButton = Object.assign(
  chakraForwardRef<"button", FileAttachmentButtonProps>(function FileAttachmentButton(
    { file, showDownloadIcon, ...props },
    ref
  ) {
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
        {showDownloadIcon ? <DownloadIcon /> : null}
      </Button>
    );
  }),
  {
    fragments: {
      FileUpload: gql`
        fragment FileAttachmentButton_FileUpload on FileUpload {
          filename
          contentType
          size
          isComplete
        }
      `,
    },
  }
);
