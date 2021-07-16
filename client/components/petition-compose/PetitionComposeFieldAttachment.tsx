import { CircularProgress, Flex, IconButton, Text } from "@chakra-ui/react";
import { CloseIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionComposeFieldAttachment_PetitionFieldAttachmentFragment } from "@parallel/graphql/__types";
import gql from "graphql-tag";
import { useIntl } from "react-intl";
import { FileIcon } from "../common/FileIcon";
import { FileName } from "../common/FileName";
import { FileSize } from "../common/FileSize";

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
      ref
    ) {
      const intl = useIntl();
      return (
        <Flex
          ref={ref}
          tabIndex={0}
          borderRadius="sm"
          border="1px solid"
          borderColor="gray.200"
          paddingX={2}
          height={8}
          alignItems="center"
          color="gray.600"
          transition="200ms ease"
          outline="none"
          _hover={{
            borderColor: "gray.300",
            backgroundColor: "white",
            color: "gray.700",
          }}
          _focus={{
            borderColor: "gray.400",
            backgroundColor: "white",
            color: "gray.700",
            shadow: "outline",
          }}
          aria-label={intl.formatMessage(
            {
              id: "component.petition-compose-field-attachment.label",
              defaultMessage:
                "Attached file: {filename}. To see the file, press Enter. To remove it, press Delete.",
            },
            { filename: attachment.file.filename }
          )}
          sx={{
            "&:hover button": {
              display: "block",
            },
            "&:hover .progress-indicator": {
              display: "none",
            },
          }}
          onKeyDown={(e) => {
            switch (e.key) {
              case "Enter":
                onDownload();
                break;
              case "Delete":
              case "Backspace":
                onRemove();
                break;
            }
          }}
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
              role="button"
              cursor="pointer"
              maxWidth="200px"
              onClick={() => onDownload()}
            />
            <Text
              as="span"
              fontSize="sm"
              color="gray.500"
              marginLeft={1}
              whiteSpace="nowrap"
            >
              (<FileSize value={attachment.file.size} />)
            </Text>
          </Flex>
          <CircularProgress
            className="progress-indicator"
            value={(progress ?? 0) * 100}
            size="20px"
            display={attachment.file.isComplete ? "none" : "block"}
          />
          {!isDisabled ? (
            <IconButton
              display={attachment.file.isComplete ? "block" : "none"}
              tabIndex={-1}
              variant="ghost"
              aria-label={intl.formatMessage({
                id: "component.petition-compose-field-attachment.remove-attachment",
                defaultMessage: "Remove attachment",
              })}
              _active={{
                shadow: "none",
              }}
              _focus={{
                shadow: "none",
              }}
              icon={<CloseIcon />}
              boxSize={5}
              minWidth={0}
              fontSize="9px"
              paddingX={0}
              shadow="none"
              onClick={onRemove}
            />
          ) : null}
        </Flex>
      );
    }
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
        }
      `,
    },
  }
);
