import { gql } from "@apollo/client";
import { Box, Center, Flex, HStack, IconButton, Stack, Text } from "@chakra-ui/react";
import { CloseIcon } from "@parallel/chakra/icons";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileIcon } from "@parallel/components/common/FileIcon";
import { FileName } from "@parallel/components/common/FileName";
import { FileSize } from "@parallel/components/common/FileSize";
import { SuggestionsButton } from "@parallel/components/common/SuggestionsButton";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { discriminator } from "@parallel/utils/discriminator";
import { downloadLocalFile } from "@parallel/utils/downloadLocalFile";
import { useDownloadProfileFieldFile } from "@parallel/utils/useDownloadProfileFieldFile";
import { useIsGlobalKeyDown } from "@parallel/utils/useIsGlobalKeyDown";
import { useIsMouseOver } from "@parallel/utils/useIsMouseOver";
import { nanoid } from "nanoid";
import { useRef } from "react";
import { Controller } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { differenceWith, isNullish, noop, sumBy } from "remeda";
import { ProfileFormFieldProps } from "./ProfileFormField";
import { ProfileFieldExpiresAtIcon } from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldFileUploadProps extends ProfileFormFieldProps {
  showSuggestionsButton: boolean;
  areSuggestionsVisible: boolean;
  onToggleSuggestions: () => void;
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
  expiryDate?: string | null;
}

export type ProfileFormFieldFileAction =
  | { type: "ADD"; file: File; id: string }
  | { type: "COPY"; file: { name: string; type: string; size: number }; id: string }
  | { type: "DELETE"; id: string }
  | { type: "UPDATE" };

export function ProfileFormFieldFileUpload({
  profileId,
  field,
  files,
  index,
  control,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
}: ProfileFormFieldFileUploadProps) {
  const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100 MB
  const intl = useIntl();

  const downloadProfileFieldFile = useDownloadProfileFieldFile();

  const handleDownloadAttachment = async (profileFieldFileId: string, preview?: boolean) => {
    await downloadProfileFieldFile(profileId, field.id, profileFieldFileId, preview);
  };

  const showErrorDialog = useErrorDialog();

  return (
    <Controller
      name={`fields.${index}.content.value`}
      control={control}
      render={({ field: { onChange, value, ...rest } }) => {
        const actions = (value as ProfileFormFieldFileAction[]) ?? [];
        return (
          <Stack>
            <HStack align="start">
              <Flex gap={2} wrap="wrap" flex="1">
                {differenceWith(
                  files ?? [],
                  actions.filter(discriminator("type", "DELETE")),
                  (file, action) => action.id === file.id,
                ).map(({ id, file }) => {
                  if (isNullish(file)) {
                    return null;
                  }
                  const { filename, contentType, size } = file;
                  return (
                    <ProfileFile
                      key={id}
                      name={filename}
                      type={contentType}
                      size={size}
                      onPreview={(preview) => handleDownloadAttachment(id, preview)}
                      onRemove={() => onChange([...(value ?? []), { type: "DELETE", id }])}
                      isDisabled={isDisabled}
                    />
                  );
                })}
                {actions
                  .filter(discriminator("type", ["ADD", "COPY"]))
                  .map(({ id, file, type }) => {
                    return (
                      <ProfileFile
                        key={id}
                        name={file.name}
                        type={file.type}
                        size={file.size}
                        onPreview={(preview) => type === "ADD" && downloadLocalFile(file, preview)}
                        onRemove={() => {
                          onChange(
                            actions.filter(
                              (a) => !((a.type === "ADD" || a.type === "COPY") && a.id === id),
                            ),
                          );
                        }}
                        isDisabled={isDisabled}
                      />
                    );
                  })}
              </Flex>
              {field.isExpirable && expiryDate ? (
                <ProfileFieldExpiresAtIcon
                  expiryDate={expiryDate}
                  expiryAlertAheadTime={field.expiryAlertAheadTime}
                  paddingTop={2}
                />
              ) : null}
              {showSuggestionsButton ? (
                <Box paddingTop={1}>
                  <SuggestionsButton
                    areSuggestionsVisible={areSuggestionsVisible}
                    onClick={onToggleSuggestions}
                  />
                </Box>
              ) : null}
            </HStack>
            <Dropzone
              as={Center}
              maxSize={MAX_FILE_SIZE}
              maxFiles={10}
              disabled={
                isDisabled ||
                (files ?? []).length +
                  sumBy(actions, (a) => (a.type === "ADD" ? 1 : a.type === "DELETE" ? -1 : 0)) >=
                  10
              }
              multiple={true}
              onDrop={async (acceptedFiles = [], rejectedFiles = []) => {
                if (rejectedFiles.some((f) => f.errors.some((e) => e.code === "file-too-large"))) {
                  await showErrorDialog({
                    message: intl.formatMessage(
                      {
                        id: "component.profile-field-file-upload.invalid-attachment-message.file-too-large",
                        defaultMessage: "Only attachments of up to {size} are allowed.",
                      },
                      { size: <FileSize value={MAX_FILE_SIZE} /> },
                    ),
                  });
                } else if (
                  rejectedFiles.some((f) => f.errors.some((e) => e.code === "too-many-files"))
                ) {
                  await showErrorDialog({
                    message: intl.formatMessage(
                      {
                        id: "component.profile-field-file-upload.invalid-attachment-message.too-many-files",
                        defaultMessage: "You can upload up to {max} files.",
                      },
                      { max: 10 },
                    ),
                  });
                } else {
                  onChange([
                    ...(value ?? []),
                    ...acceptedFiles.map((file) => ({ id: nanoid(), type: "ADD", file })),
                  ]);
                  showExpiryDateDialog({ force: true });
                }
              }}
              {...rest}
            >
              <Text pointerEvents="none" fontSize="sm">
                <FormattedMessage
                  id="generic.dropzone-single-default"
                  defaultMessage="Drag the file here, or click to select it"
                />
              </Text>
            </Dropzone>
          </Stack>
        );
      }}
    />
  );
}

interface ProfileFileProps {
  name: string;
  type: string;
  size: number;
  onRemove: () => void;
  onPreview: (preview: boolean) => void;
  isDisabled?: boolean;
}

function ProfileFile({ name, type, size, onRemove, onPreview, isDisabled }: ProfileFileProps) {
  const intl = useIntl();

  const nameRef = useRef<HTMLSpanElement>(null);
  const isMouseOver = useIsMouseOver(nameRef);
  const isShiftDown = useIsGlobalKeyDown("Shift");

  return (
    <Flex
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
          id: "component.profile-file.aria-label",
          defaultMessage:
            "Attached file: {filename}. To see the file, press Enter. {isReadOnly, select, true{} other {To remove it, press Delete.}}",
        },
        { filename: name, isReadOnly: isDisabled },
      )}
      onKeyDown={
        isDisabled
          ? noop
          : (e) => {
              switch (e.key) {
                case "Enter":
                  onPreview(isShiftDown ? false : true);
                  break;
                case "Delete":
                case "Backspace":
                  onRemove();
                  break;
              }
            }
      }
    >
      <FileIcon boxSize="18px" filename={name} contentType={type} hasFailed={false} />
      <Flex marginX={2}>
        <FileName
          ref={nameRef}
          value={name}
          fontSize="sm"
          fontWeight="500"
          role="button"
          cursor="pointer"
          maxWidth="200px"
          onClick={() => onPreview(isMouseOver && isShiftDown ? false : true)}
        />
        <Text as="span" fontSize="sm" color="gray.500" marginStart={1} whiteSpace="nowrap">
          (<FileSize value={size} />)
        </Text>
      </Flex>
      <IconButton
        isDisabled={isDisabled}
        tabIndex={-1}
        variant="ghost"
        aria-label={intl.formatMessage({
          id: "component.profile-file.remove-attachment",
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
    </Flex>
  );
}

ProfileFormFieldFileUpload.fragments = {
  get ProfileFieldFile() {
    return gql`
      fragment ProfileFieldFileUpload_ProfileFieldFile on ProfileFieldFile {
        id
        expiryDate
        file {
          contentType
          filename
          isComplete
          size
        }
      }
    `;
  },
};
