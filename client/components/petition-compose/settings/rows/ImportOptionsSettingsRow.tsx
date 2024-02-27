import { Button, Stack } from "@chakra-ui/react";
import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { SettingsRow } from "./SettingsRow";
import { gql } from "@apollo/client";
import {
  Center,
  HStack,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { ImportOptionsSettingsRow_PetitionFieldFragment } from "@parallel/graphql/__types";
import { generateValueLabelExcel } from "@parallel/utils/generateValueLabelExcel";
import { parseValueLabelFromExcel } from "@parallel/utils/parseValueLabelFromExcel";
import { sanitizeFilenameWithSuffix } from "@parallel/utils/sanitizeFilenameWithSuffix";
import { useState } from "react";
import { FileRejection } from "react-dropzone";
import { Dropzone } from "../../../common/Dropzone";
import { FileSize } from "../../../common/FileSize";
import { BaseDialog } from "../../../common/dialogs/BaseDialog";
import { DialogProps, useDialog } from "../../../common/dialogs/DialogProvider";

export function ImportOptionsSettingsRow({
  field,
  onChange,
  isDisabled,
}: {
  field: ImportOptionsSettingsRow_PetitionFieldFragment;
  onChange: (data: UpdatePetitionFieldInput) => void;
  isDisabled?: boolean;
}) {
  const showImportSelectOptionsDialog = useDialog(ImportSelectOptionsDialog);
  const handleImportOptions = async () => {
    try {
      const { values, labels } = await showImportSelectOptionsDialog({ field });
      onChange({
        options: { ...field.options, values, labels },
      });
    } catch {}
  };
  return (
    <SettingsRow
      label={
        <FormattedMessage
          id="component.import-options-settings-row.label"
          defaultMessage="Import options from Excel"
        />
      }
      description={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.import-options-settings-row.description-1"
              defaultMessage="Upload an <b>.xlsx file</b> to load the list of options."
            />
          </Text>
        </Stack>
      }
      controlId="import-options-excel"
    >
      <Button
        size="sm"
        fontWeight="normal"
        fontSize="16px"
        isDisabled={isDisabled}
        onClick={handleImportOptions}
      >
        <FormattedMessage id="generic.import" defaultMessage="Import" />
      </Button>
    </SettingsRow>
  );
}

ImportOptionsSettingsRow.fragments = {
  PetitionField: gql`
    fragment ImportOptionsSettingsRow_PetitionField on PetitionField {
      id
      title
      options
    }
  `,
};

const MAX_FILESIZE = 1024 * 1024 * 10;

interface ImportSelectOptionsDialogProps {
  field: ImportOptionsSettingsRow_PetitionFieldFragment;
}

export function ImportSelectOptionsDialog({
  field,
  ...props
}: DialogProps<
  ImportSelectOptionsDialogProps,
  {
    values: string[];
    labels: string[] | null;
  }
>) {
  const intl = useIntl();

  const fieldHasOptions = field.options.values.length > 0;
  const [fileDropError, setFileDropError] = useState<string | null>(null);

  const showErrorDialog = useErrorDialog();
  async function handleFileDrop([file]: File[], rejected: FileRejection[]) {
    if (rejected.length > 0) {
      setFileDropError(rejected[0].errors[0].code);
    } else {
      try {
        props.onResolve(await parseValueLabelFromExcel(file));
      } catch {
        await showErrorDialog.ignoringDialogErrors({
          header: (
            <FormattedMessage
              id="component.import-select-options-dialog.import-from-excel-error-dialog-header"
              defaultMessage="Import error"
            />
          ),
          message: (
            <Stack>
              <Text>
                <FormattedMessage
                  id="component.import-select-options-dialog.import-from-excel-error-dialog-body"
                  defaultMessage="Please, review your file and make sure there are no empty values."
                />
              </Text>
              <Text>
                <FormattedMessage
                  id="component.import-select-options-dialog.import-from-excel-error-dialog-body-2"
                  defaultMessage="If you want to add labels to the values, all values must have a label."
                />
              </Text>
            </Stack>
          ),
        });
      }
    }
  }

  async function handleDownloadEmptyOptions() {
    await generateValueLabelExcel(intl, {
      fileName: sanitizeFilenameWithSuffix(
        intl.formatMessage({
          id: "component.import-select-options-dialog.default-file-name",
          defaultMessage: "options",
        }),
        ".xlsx",
      ),
      values: [],
      labels: [],
    });
  }

  async function handleDownloadExistingOptions() {
    await generateValueLabelExcel(intl, {
      fileName: sanitizeFilenameWithSuffix(
        field.title ??
          intl.formatMessage({
            id: "component.import-select-options-dialog.default-file-name",
            defaultMessage: "options",
          }),
        ".xlsx",
      ),
      values: field.options.values,
      labels: field.options.labels ?? null,
    });
  }

  return (
    <BaseDialog size="lg" {...props}>
      <ModalContent>
        <ModalHeader>
          <FormattedMessage
            id="component.import-select-options-dialog.header"
            defaultMessage="Import options from Excel"
          />
        </ModalHeader>
        <ModalCloseButton
          aria-label={intl.formatMessage({
            id: "generic.close",
            defaultMessage: "Close",
          })}
        />
        <ModalBody>
          <Text fontSize="sm" color="gray.600">
            <FormattedMessage
              id="component.import-select-options-dialog.attach-xlsx"
              defaultMessage="Upload a .xlsx file like the provided model. If you want to keep the existing options, download them to include them in the import."
            />
          </Text>
          <Dropzone
            as={Center}
            marginY={2}
            height="100px"
            accept={{
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            }}
            maxSize={MAX_FILESIZE}
            multiple={false}
            onDrop={handleFileDrop}
          >
            {false ? (
              <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="primary.500" />
            ) : (
              <Text pointerEvents="none" fontSize="sm">
                <FormattedMessage
                  id="generic.dropzone-single-default"
                  defaultMessage="Drag the file here, or click to select it"
                />
              </Text>
            )}
          </Dropzone>
          {fileDropError && (
            <Text color="red.500" fontSize="sm">
              {fileDropError === "file-too-large" ? (
                <FormattedMessage
                  id="generic.dropzone-error-file-too-large"
                  defaultMessage="The file is too large. Maximum size allowed {size}"
                  values={{ size: <FileSize value={MAX_FILESIZE} /> }}
                />
              ) : fileDropError === "file-invalid-type" ? (
                <FormattedMessage
                  id="generic.dropzone-error-file-invalid-type"
                  defaultMessage="File type not allowed. Please, attach an {extension} file"
                  values={{ extension: ".xlsx" }}
                />
              ) : null}
            </Text>
          )}

          <HStack marginTop={4} marginBottom={2} spacing={4}>
            <Button
              fontWeight="bold"
              variant="link"
              rightIcon={<DownloadIcon />}
              onClick={handleDownloadEmptyOptions}
            >
              <FormattedMessage
                id="component.import-select-options-dialog.download-empty-model"
                defaultMessage="Download empty model"
              />
            </Button>
            {fieldHasOptions ? (
              <Button
                fontWeight="bold"
                variant="link"
                rightIcon={<DownloadIcon />}
                onClick={handleDownloadExistingOptions}
              >
                <FormattedMessage
                  id="component.import-select-options-dialog.download-existing-options"
                  defaultMessage="Download existing options"
                />
              </Button>
            ) : null}
          </HStack>
        </ModalBody>
      </ModalContent>
    </BaseDialog>
  );
}
