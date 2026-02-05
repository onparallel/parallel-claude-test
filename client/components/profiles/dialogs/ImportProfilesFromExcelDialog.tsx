import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Box,
  Button,
  Center,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Spinner,
} from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import {
  ImportProfilesFromExcelDialog_profileImportExcelModelDownloadLinkDocument,
  UserLocale,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useProfilesExcelImportTask } from "@parallel/utils/tasks/useProfilesExcelImportTask";
import { useState } from "react";
import { FileRejection } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
import { BaseDialog, DialogProps, useDialog } from "../../common/dialogs/DialogProvider";
import { Dropzone } from "../../common/Dropzone";
import { FileSize } from "../../common/FileSize";
import { Text } from "@parallel/components/ui";

const MAX_FILESIZE = 1024 * 1024 * 10;

export function ImportProfilesFromExcelDialog({
  profileTypeId,
  ...props
}: DialogProps<{ profileTypeId: string }, { count: number }>) {
  const intl = useIntl();

  const [fileDropError, setFileDropError] = useState<string | null>(null);

  const [profilesExcelImportTask, { loading: isUploading }] = useProfilesExcelImportTask();

  async function handleFileDrop([file]: File[], rejected: FileRejection[]) {
    if (rejected.length > 0) {
      setFileDropError(rejected[0].errors[0].code);
    } else {
      try {
        const { count } = await profilesExcelImportTask({
          profileTypeId,
          file,
        });
        props.onResolve({ count });
      } catch {}
    }
  }

  const [profileImportExcelModelDownloadLink] = useMutation(
    ImportProfilesFromExcelDialog_profileImportExcelModelDownloadLinkDocument,
  );

  const handleDownloadProfileExcelModel = async () => {
    await withError(
      openNewWindow(async () => {
        const { data } = await profileImportExcelModelDownloadLink({
          variables: { locale: intl.locale as UserLocale, profileTypeId },
        });
        if (!data) {
          throw new Error();
        }
        return data!.profileImportExcelModelDownloadLink;
      }),
    );
  };

  return (
    <BaseDialog size="lg" closeOnOverlayClick={!isUploading} closeOnEsc={!isUploading} {...props}>
      <ModalContent>
        <ModalHeader>
          <FormattedMessage
            id="component.import-profiles-from-excel-dialog.header"
            defaultMessage="Import profiles from Excel"
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
              id="component.import-profiles-from-excel-dialog.attach-xlsx"
              defaultMessage="Attach an <b>.xlsx file</b> like the one in the model to add your profiles."
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
            disabled={isUploading}
          >
            {isUploading ? (
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

          <Box marginTop={4} marginBottom={2}>
            <Button variant="link" fontWeight={600} onClick={handleDownloadProfileExcelModel}>
              <FormattedMessage
                id="component.import-profiles-from-excel-dialog.download-model"
                defaultMessage="Download profile loading model"
              />

              <DownloadIcon marginStart={2} />
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </BaseDialog>
  );
}

ImportProfilesFromExcelDialog.mutations = [
  gql`
    mutation ImportProfilesFromExcelDialog_profileImportExcelModelDownloadLink(
      $profileTypeId: GID!
      $locale: UserLocale!
    ) {
      profileImportExcelModelDownloadLink(profileTypeId: $profileTypeId, locale: $locale)
    }
  `,
];

export function useImportProfilesFromExcelDialog() {
  return useDialog(ImportProfilesFromExcelDialog);
}
