import { gql } from "@apollo/client";
import {
  Box,
  Center,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Spinner,
  Text,
  useFormControl,
} from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import { useImportContactsDialog_bulkCreateContactsMutation } from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
import { BaseDialog } from "../common/BaseDialog";

import { DialogProps } from "../common/DialogProvider";
import { useErrorDialog } from "../common/ErrorDialog";
import { FileSize } from "../common/FileSize";
import { NormalLink } from "../common/Link";

const MAX_FILESIZE = 1024 * 1024 * 10;

export function ImportContactsDialog(
  props: DialogProps<{}, { count: number }>
) {
  const inputProps = useFormControl({});
  const intl = useIntl();

  const [fileDropError, setFileDropError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const showErrorDialog = useErrorDialog();

  const [
    bulkCreateContacts,
  ] = useImportContactsDialog_bulkCreateContactsMutation();
  async function handleFileDrop([file]: File[], rejected: FileRejection[]) {
    if (rejected.length > 0) {
      setFileDropError(rejected[0].errors[0].code);
    } else {
      setIsUploading(true);
      const [error, result] = await withError(
        bulkCreateContacts({
          variables: { file },
        })
      );
      setIsUploading(false);
      if (error) {
        await withError(
          showErrorDialog({
            header: (
              <FormattedMessage
                id="generic.import-error"
                defaultMessage="Import error"
              />
            ),
            message: (
              <FormattedMessage
                id="contacts.import-from-excel.import-error.body"
                defaultMessage="Please, review your file and make sure it matches the format on the loading model."
              />
            ),
          })
        );
      } else {
        props.onResolve({ count: result!.data!.bulkCreateContacts.length });
      }
    }
  }

  const { getRootProps, getInputProps } = useDropzone({
    accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    maxSize: MAX_FILESIZE,
    multiple: false,
    onDrop: handleFileDrop,
    disabled: isUploading,
  });

  return (
    <BaseDialog
      size="lg"
      closeOnOverlayClick={!isUploading}
      closeOnEsc={!isUploading}
      {...props}
    >
      <ModalContent>
        <ModalHeader>
          <FormattedMessage
            id="contacts.import-from-excel.header"
            defaultMessage="Import contacts from Excel"
          />
        </ModalHeader>
        <ModalCloseButton
          isDisabled={isUploading}
          aria-label={intl.formatMessage({
            id: "generic.close",
            defaultMessage: "Close",
          })}
        />
        <ModalBody>
          <Text fontSize="sm" color="gray.600">
            <FormattedMessage
              id="contacts.import-from-excel.attach-xlsx"
              defaultMessage="Attach an <b>.xlsx file</b> like the one in the model to add your contacts."
              values={{
                b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              }}
            />
          </Text>
          <Center
            marginY={2}
            height="100px"
            borderWidth={2}
            borderStyle="dashed"
            borderColor="gray.300"
            borderRadius="md"
            padding={4}
            {...getRootProps()}
          >
            <input {...inputProps} {...getInputProps()} />
            {isUploading ? (
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="purple.500"
              />
            ) : (
              <Text pointerEvents="none" fontSize="sm" color="gray.500">
                <FormattedMessage
                  id="generic.dropzone-single.default"
                  defaultMessage="Drag the file here, or click to select it"
                />
              </Text>
            )}
          </Center>
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
          <Box marginTop={4} marginBottom={2}>
            <NormalLink
              fontWeight="bold"
              href={`${
                process.env.NEXT_PUBLIC_ASSETS_URL
              }/static/documents/contact_import_model_${
                intl.locale ?? "en"
              }.xlsx`}
            >
              <FormattedMessage
                id="contacts.import-from-excel.download-model"
                defaultMessage="Download contact loading model"
              />
              <DownloadIcon marginLeft={2} />
            </NormalLink>
          </Box>
        </ModalBody>
      </ModalContent>
    </BaseDialog>
  );
}

ImportContactsDialog.mutations = [
  gql`
    mutation ImportContactsDialog_bulkCreateContacts($file: Upload!) {
      bulkCreateContacts(file: $file) {
        id
      }
    }
  `,
];
