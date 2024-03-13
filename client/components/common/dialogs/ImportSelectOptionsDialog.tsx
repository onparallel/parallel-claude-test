import {
  Button,
  Center,
  HStack,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileSize } from "@parallel/components/common/FileSize";
import { BaseDialog } from "@parallel/components/common/dialogs/BaseDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { useState } from "react";
import { FileRejection } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";

const MAX_FILESIZE = 1024 * 1024 * 10;

interface ImportSelectOptionsDialogProps {
  hasOptions: boolean;
  onDownloadEmptyOptions: () => void;
  onDownloadExistingOptions: () => void;
  onExcelDrop: (file: File) => Promise<void>;
}

function ImportSelectOptionsDialog({
  hasOptions,
  onDownloadEmptyOptions,
  onDownloadExistingOptions,
  onExcelDrop,
  ...props
}: DialogProps<ImportSelectOptionsDialogProps, {}>) {
  const intl = useIntl();

  const [fileDropError, setFileDropError] = useState<string | null>(null);

  const showErrorDialog = useErrorDialog();
  async function handleFileDrop([file]: File[], rejected: FileRejection[]) {
    if (rejected.length > 0) {
      setFileDropError(rejected[0].errors[0].code);
    } else {
      try {
        await onExcelDrop(file);
        props.onResolve();
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
              onClick={onDownloadEmptyOptions}
            >
              <FormattedMessage
                id="component.import-select-options-dialog.download-empty-model"
                defaultMessage="Download empty model"
              />
            </Button>
            {hasOptions ? (
              <Button
                fontWeight="bold"
                variant="link"
                rightIcon={<DownloadIcon />}
                onClick={onDownloadExistingOptions}
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

export function useImportSelectOptionsDialog() {
  return useDialog(ImportSelectOptionsDialog);
}
