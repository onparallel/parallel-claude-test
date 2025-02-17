import { gql } from "@apollo/client";
import { Box, Center, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileAttachment } from "@parallel/components/common/FileAttachment";
import { FileSize } from "@parallel/components/common/FileSize";
import { SuggestionsButton } from "@parallel/components/common/SuggestionsButton";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { discriminator } from "@parallel/utils/discriminator";
import { downloadLocalFile } from "@parallel/utils/downloadLocalFile";
import { useDownloadProfileFieldFile } from "@parallel/utils/useDownloadProfileFieldFile";
import { nanoid } from "nanoid";
import { Controller } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { differenceWith, isNullish, sumBy } from "remeda";
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
                    <FileAttachment
                      key={id}
                      filename={filename}
                      contentType={contentType}
                      size={size}
                      isComplete={true}
                      onDownload={(preview) => handleDownloadAttachment(id, preview)}
                      onRemove={() => onChange([...(value ?? []), { type: "DELETE", id }])}
                      isDisabled={isDisabled}
                    />
                  );
                })}
                {actions
                  .filter(discriminator("type", ["ADD", "COPY"]))
                  .map(({ id, file, type }) => {
                    return (
                      <FileAttachment
                        key={id}
                        filename={file.name}
                        contentType={file.type}
                        size={file.size}
                        isComplete={true}
                        onDownload={(preview) => type === "ADD" && downloadLocalFile(file, preview)}
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
