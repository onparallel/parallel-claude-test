import { gql, useMutation } from "@apollo/client";
import { Box, Center, Flex, List, ListItem, Progress, Stack, Text } from "@chakra-ui/react";
import { DeleteIcon, DownloadIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { FileName } from "@parallel/components/common/FileName";
import { FileSize } from "@parallel/components/common/FileSize";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NormalLink } from "@parallel/components/common/Link";
import {
  DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkDocument,
  DynamicSelectSettings_uploadDynamicSelectFieldFileDocument,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useMemo, useState } from "react";
import { FileRejection } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
import { PetitionComposeFieldSettingsProps } from "./PetitionComposeFieldSettings";
import { SettingsRow } from "./SettingsRow";

export function DynamicSelectSettings({
  petitionId,
  field,
  onFieldEdit,
  isReadOnly,
}: { petitionId: string } & Pick<
  PetitionComposeFieldSettingsProps,
  "field" | "onFieldEdit" | "isReadOnly"
>) {
  const intl = useIntl();
  const fieldOptions = field.options as FieldOptions["DYNAMIC_SELECT"];

  function handleRemoveOptions() {
    onFieldEdit(field.id, { options: { labels: [], values: [], file: null } });
  }

  const [downloadLink] = useMutation(
    DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkDocument
  );

  function handleDownloadListingsFile() {
    openNewWindow(async () => {
      const { data } = await downloadLink({
        variables: { petitionId, fieldId: field.id },
      });
      const { url, result } = data!.dynamicSelectFieldFileDownloadLink;
      if (result !== "SUCCESS") {
        throw new Error();
      }
      return url!;
    });
  }

  return (
    <Stack spacing={4}>
      <SettingsRow
        isDisabled={isReadOnly}
        flexDirection="column"
        alignItems="start"
        label={
          <Text as="strong">
            <FormattedMessage
              id="field-settings.dynamic-select.import-from-excel.label"
              defaultMessage="Import options from Excel"
            />
          </Text>
        }
        description={
          <Text fontSize="sm">
            <FormattedMessage
              id="field-settings.dynamic-select.import-from-excel.description"
              defaultMessage="Import listings to create related dropdowns. You can use the importing model as a guide."
            />
          </Text>
        }
        controlId="dynamic-select-options"
      >
        <Stack alignSelf="stretch">
          {fieldOptions.file ? (
            <DynamicSelectLoadedOptions
              options={fieldOptions}
              onRemoveOptions={handleRemoveOptions}
              onDownloadOptions={handleDownloadListingsFile}
              isReadOnly={isReadOnly}
            />
          ) : (
            <DynamicSelectOptionsDropzone
              petitionId={petitionId}
              fieldId={field.id}
              isReadOnly={isReadOnly}
            />
          )}
          <NormalLink
            fontWeight="bold"
            href={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/documents/import_model_${
              intl.locale ?? "en"
            }.xlsx`}
          >
            <FormattedMessage
              id="field-settings.dynamic-select.import-from-excel.download-model"
              defaultMessage="Download option loading model"
            />
            <DownloadIcon marginLeft={2} />
          </NormalLink>
        </Stack>
      </SettingsRow>
    </Stack>
  );
}

function UploadedFileData({
  file,
  onDownload,
  onRemoveOptions,
  isReadOnly,
}: {
  file?: { name: string; size: number; updatedAt: Date };
  onDownload?: () => void;
  onRemoveOptions?: () => void;
  isReadOnly?: boolean;
}) {
  const intl = useIntl();
  return (
    <Stack direction="row" alignItems="center" marginTop={2}>
      <Center
        boxSize={10}
        borderRadius="md"
        border="1px solid"
        borderColor="gray.300"
        color="gray.700"
        fontSize="xs"
        fontWeight="bold"
      >
        XLSX
      </Center>

      <Box flex="1" overflow="hidden">
        {file ? (
          <Flex minWidth={0} whiteSpace="nowrap" alignItems="baseline">
            <FileName value={file.name} />
            <Text as="span" marginX={2}>
              -
            </Text>
            <Text as="span" fontSize="xs" color="gray.500">
              <FileSize value={file.size} />
            </Text>
          </Flex>
        ) : (
          <Center height="18px">
            <Progress
              borderRadius="sm"
              width="100%"
              isIndeterminate
              size="xs"
              colorScheme="green"
            />
          </Center>
        )}
        {file && (
          <Text fontSize="xs">
            <DateTime value={file.updatedAt} format={FORMATS.LLL} useRelativeTime />
          </Text>
        )}
      </Box>

      <IconButtonWithTooltip
        variant="ghost"
        isDisabled={!file}
        icon={<DownloadIcon />}
        label={intl.formatMessage({
          id: "generic.download",
          defaultMessage: "Download",
        })}
        onClick={onDownload}
      />
      <IconButtonWithTooltip
        variant="ghost"
        isDisabled={!file || isReadOnly}
        icon={<DeleteIcon />}
        label={intl.formatMessage({
          id: "generic.delete",
          defaultMessage: "Delete",
        })}
        onClick={onRemoveOptions}
      />
    </Stack>
  );
}

interface DynamicSelectLoadedOptionsProps {
  options: FieldOptions["DYNAMIC_SELECT"];
  onRemoveOptions: () => void;
  onDownloadOptions: () => void;
  isReadOnly?: boolean;
}

function DynamicSelectLoadedOptions({
  options,
  onRemoveOptions,
  onDownloadOptions,
  isReadOnly,
}: DynamicSelectLoadedOptionsProps) {
  const firstRowFlattened = useMemo(() => options.values[0].flat(options.labels.length), [options]);

  return (
    <>
      <UploadedFileData
        file={options.file!}
        onRemoveOptions={onRemoveOptions}
        onDownload={onDownloadOptions}
        isReadOnly={isReadOnly}
      />

      <Stack fontSize="sm" color="gray.600" spacing={0}>
        <FormattedMessage
          id="field-settings.dynamic-select.loaded-options.example"
          defaultMessage="For example:"
        />
        <List as="ol" listStyleType="upper-alpha" listStylePos="inside">
          {options.labels.map((label, index) => (
            <ListItem key={index}>
              {label}: {firstRowFlattened[index]}
            </ListItem>
          ))}
        </List>
      </Stack>
    </>
  );
}

function DynamicSelectOptionsDropzone({
  petitionId,
  fieldId,
  isReadOnly,
}: {
  petitionId: string;
  fieldId: string;
  isReadOnly?: boolean;
}) {
  const MAX_FILESIZE = 1024 * 1024 * 10; // 10 MB

  const [fileDropError, setFileDropError] = useState<string | null>(null);

  const [uploadFile, { loading }] = useMutation(
    DynamicSelectSettings_uploadDynamicSelectFieldFileDocument
  );

  const showErrorDialog = useErrorDialog();
  async function handleFileDrop([file]: File[], rejected: FileRejection[]) {
    if (rejected.length > 0) {
      setFileDropError(rejected[0].errors[0].code);
    } else {
      try {
        await uploadFile({ variables: { petitionId, fieldId, file } });
      } catch {
        await showErrorDialog({
          header: (
            <FormattedMessage
              id="field-settings.dynamic-select.import-from-excel.error-dialog-header"
              defaultMessage="Import error"
            />
          ),
          message: (
            <FormattedMessage
              id="field-settings.dynamic-select.import-from-excel.error-dialog-body"
              defaultMessage="Please, review your file and make sure there are no empty cells on the listing."
            />
          ),
        });
      }
    }
  }

  return loading ? (
    <UploadedFileData />
  ) : (
    <>
      <Text fontSize="sm" color="gray.600" marginTop={1}>
        <FormattedMessage
          id="field-settings.dynamic-select.import-from-excel.attach-xlsx"
          defaultMessage="Attach an .xlsx file like the one in the model."
        />
      </Text>
      <Dropzone
        height="100px"
        as={Center}
        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        maxSize={MAX_FILESIZE}
        multiple={false}
        onDrop={handleFileDrop}
      >
        <Text pointerEvents="none" fontSize="sm">
          <FormattedMessage
            id="generic.dropzone-single.default"
            defaultMessage="Drag the file here, or click to select it"
          />
        </Text>
      </Dropzone>
      {fileDropError && (
        <Text color="red.500" fontSize="sm">
          {fileDropError === "file-too-large" ? (
            <FormattedMessage
              id="dropzone.error.file-too-large"
              defaultMessage="The file is too large. Maximum size allowed {size}"
              values={{ size: <FileSize value={MAX_FILESIZE} /> }}
            />
          ) : fileDropError === "file-invalid-type" ? (
            <FormattedMessage
              id="dropzone.error.file-invalid-type"
              defaultMessage="File type not allowed. Please, attach an {extension} file"
              values={{ extension: ".xlsx" }}
            />
          ) : null}
        </Text>
      )}
    </>
  );
}

DynamicSelectSettings.mutations = [
  gql`
    mutation DynamicSelectSettings_uploadDynamicSelectFieldFile(
      $petitionId: GID!
      $fieldId: GID!
      $file: Upload!
    ) {
      uploadDynamicSelectFieldFile(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
        id
        options
      }
    }
  `,
  gql`
    mutation DynamicSelectSettings_dynamicSelectFieldFileDownloadLink(
      $petitionId: GID!
      $fieldId: GID!
    ) {
      dynamicSelectFieldFileDownloadLink(petitionId: $petitionId, fieldId: $fieldId) {
        result
        url
      }
    }
  `,
];
