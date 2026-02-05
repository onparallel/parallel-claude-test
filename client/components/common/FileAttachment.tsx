import { CircularProgress, Flex, IconButton } from "@chakra-ui/react";
import { CloseIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useHasRemovePreviewFiles } from "@parallel/utils/useHasRemovePreviewFiles";
import { useIsGlobalKeyDown } from "@parallel/utils/useIsGlobalKeyDown";
import { useIsMouseOver } from "@parallel/utils/useIsMouseOver";
import { useRef } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { FileIcon } from "./FileIcon";
import { FileName } from "./FileName";
import { FileSize } from "./FileSize";
import { Text } from "@parallel/components/ui";

interface FileAttachmentProps {
  filename: string;
  contentType: string;
  size: number;
  isComplete: boolean;
  isDisabled?: boolean;
  onDownload: (preview: boolean) => void;
  onRemove: () => void;
  uploadHasFailed?: boolean;
  progress?: number;
}

export const FileAttachment = chakraForwardRef<"div", FileAttachmentProps>(function FileAttachment(
  {
    filename,
    contentType,
    size,
    isComplete,
    isDisabled,
    onDownload,
    onRemove,
    uploadHasFailed,
    progress,
    ...props
  },
  ref,
) {
  const intl = useIntl();
  const nameRef = useRef<HTMLSpanElement>(null);
  const isMouseOver = useIsMouseOver(nameRef);
  const isShiftDown = useIsGlobalKeyDown("Shift");
  const userHasRemovePreviewFiles = useHasRemovePreviewFiles();

  return (
    <Flex
      ref={ref}
      tabIndex={0}
      borderRadius="sm"
      border="1px solid"
      borderColor={uploadHasFailed ? "red.500" : "gray.200"}
      paddingX={2}
      height={8}
      alignItems="center"
      color="gray.600"
      transition="200ms ease"
      outline="none"
      _hover={{
        borderColor: uploadHasFailed ? "red.500" : "gray.300",
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
          id: "component.file-attachment.label",
          defaultMessage:
            "Attached file: {filename}. To see the file, press Enter. To remove it, press Delete.",
        },
        { filename },
      )}
      onKeyDown={
        isDisabled
          ? undefined
          : (e) => {
              switch (e.key) {
                case "Enter":
                  onDownload(userHasRemovePreviewFiles ? false : isShiftDown ? false : true);
                  break;
                case "Delete":
                case "Backspace":
                  onRemove();
                  break;
              }
            }
      }
      {...props}
    >
      <FileIcon boxSize="18px" filename={filename} contentType={contentType} />
      <Flex marginX={2}>
        <FileName
          ref={nameRef}
          value={filename}
          fontSize="sm"
          fontWeight="500"
          role="button"
          cursor="pointer"
          maxWidth="200px"
          onClick={
            uploadHasFailed
              ? undefined
              : () =>
                  onDownload(
                    userHasRemovePreviewFiles ? false : isMouseOver && isShiftDown ? false : true,
                  )
          }
        />

        <Text as="span" fontSize="sm" color="gray.500" marginStart={1} whiteSpace="nowrap">
          (<FileSize value={size} />)
        </Text>
      </Flex>
      {isNonNullish(progress) ? (
        <CircularProgress
          value={progress * 100}
          size="20px"
          display={isComplete || uploadHasFailed ? "none" : "block"}
          className="progress-indicator"
        />
      ) : null}
      {!isDisabled ? (
        <IconButton
          tabIndex={-1}
          variant="ghost"
          aria-label={intl.formatMessage({
            id: "component.file-attachment.remove-attachment",
            defaultMessage: "Remove attachment",
          })}
          icon={<CloseIcon />}
          boxSize={5}
          minWidth={0}
          fontSize="9px"
          paddingX={0}
          onClick={onRemove}
        />
      ) : null}
    </Flex>
  );
});
