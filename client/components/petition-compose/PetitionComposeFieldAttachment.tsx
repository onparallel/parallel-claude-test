import { CircularProgress, Flex, Text } from "@chakra-ui/react";
import { CloseIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";
import { FileIcon } from "../common/FileIcon";
import { FileName } from "../common/FileName";
import { FileSize } from "../common/FileSize";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  isCompleted: boolean;
}
export const PetitionComposeFieldAttachment = chakraForwardRef<
  "div",
  {
    attachment: Attachment;
    onDownload: () => void;
    onRemove: () => void;
  }
>(function PetitionComposeFieldAttachment(
  {
    attachment: { filename, contentType, size, isCompleted },
    onDownload,
    onRemove,
    ...props
  },
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
        { filename }
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
      <FileIcon boxSize="18px" filename={filename} contentType={contentType} />
      <Flex marginX={2}>
        <FileName
          value={filename}
          fontSize="sm"
          fontWeight="500"
          role="button"
          cursor="pointer"
          onClick={() => onDownload()}
        />
        <Text as="span" fontSize="sm" color="gray.500" marginLeft={1}>
          (<FileSize value={size} />)
        </Text>
      </Flex>
      <CircularProgress
        className="progress-indicator"
        value={10}
        size="20px"
        display={isCompleted ? "none" : "block"}
      />
      <IconButtonWithTooltip
        display={isCompleted ? "block" : "none"}
        tabIndex={-1}
        variant="ghost"
        label={intl.formatMessage({
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
      />
    </Flex>
  );
});
