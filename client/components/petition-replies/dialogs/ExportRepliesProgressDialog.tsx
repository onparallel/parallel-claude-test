import { gql, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CheckIcon, CloudUploadIcon } from "@parallel/chakra/icons";
import { BaseDialog } from "@parallel/components/common/dialogs/BaseDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { useCuatrecasasExport } from "@parallel/components/petition-common/useCuatrecasasExport";
import { ExportRepliesProgressDialog_petitionDocument } from "@parallel/graphql/__types";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { useFilenamePlaceholdersRename } from "@parallel/utils/useFilenamePlaceholders";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { countBy } from "remeda";

export interface ExportRepliesProgressDialogProps {
  externalClientId: string;
  petitionId: string;
  pattern: string;
}

export function ExportRepliesProgressDialog({
  petitionId,
  pattern,
  externalClientId,
  ...props
}: DialogProps<ExportRepliesProgressDialogProps>) {
  const intl = useIntl();
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<"LOADING" | "UPLOADING" | "FINISHED">("LOADING");
  const { data } = useQuery(ExportRepliesProgressDialog_petitionDocument, {
    variables: { petitionId },
  });
  const isRunning = useRef(false);
  const placeholdersRename = useFilenamePlaceholdersRename();

  const { current: abort } = useRef(new AbortController());

  const showErrorDialog = useErrorDialog();

  const cuatrecasasExport = useCuatrecasasExport(externalClientId);

  useEffect(() => {
    async function exportReplies() {
      const petition = data!.petition!;
      if (petition.__typename !== "Petition") {
        return;
      }
      const rename = placeholdersRename(petition.fields);
      const replies = petition.fields.flatMap((field) =>
        field.replies.map((reply) => ({ reply, field }))
      );

      const hasTextReplies = !!replies.find((r) => !isFileTypeField(r.field.type));

      const hasSignedDocument =
        petition.currentSignatureRequest?.status === "COMPLETED" &&
        !!petition.currentSignatureRequest.signedDocumentFilename;

      const hasAuditTrail =
        petition.currentSignatureRequest?.status === "COMPLETED" &&
        !!petition.currentSignatureRequest.auditTrailFilename;

      const totalFiles =
        (hasTextReplies ? 1 : 0) + // exported excel with text replies
        countBy(replies, (r) => isFileTypeField(r.field.type)) + // every uploaded file reply
        (hasSignedDocument ? 1 : 0) + // signed doc
        (hasAuditTrail ? 1 : 0) + // audit trail
        1; // PDF document;

      setState("UPLOADING");
      let uploaded = 0;
      let excelExternalId: null | string = null;

      try {
        if (hasTextReplies) {
          excelExternalId = await cuatrecasasExport.exportExcel(petition, {
            signal: abort.signal,
            onProgress: ({ loaded, total }) =>
              setProgress((uploaded + (loaded / total) * 0.5) / totalFiles),
          });
          setProgress(++uploaded / totalFiles);
        }

        for (const { reply, field } of replies) {
          await cuatrecasasExport.exportFieldReply(
            {
              petitionId: petition.id,
              excelExternalId,
              field,
              reply,
            },
            {
              filename: isFileTypeField(field.type) ? rename(field, reply, pattern) : "",
              onProgress: ({ loaded, total }) =>
                setProgress((uploaded + (loaded / total) * 0.5) / totalFiles),
              signal: abort.signal,
            }
          );
          if (isFileTypeField(field.type)) {
            setProgress(++uploaded / totalFiles);
          }
        }

        let signedDocExternalId: string | undefined = undefined;
        if (hasSignedDocument) {
          signedDocExternalId = await cuatrecasasExport.exportSignedDocument(
            petition.currentSignatureRequest!,
            {
              signal: abort.signal,
              onProgress: ({ loaded, total }) =>
                setProgress((uploaded + (loaded / total) * 0.5) / totalFiles),
            }
          );
          setProgress(++uploaded / totalFiles);
        }

        if (hasAuditTrail) {
          await cuatrecasasExport.exportAuditTrail(
            {
              ...petition.currentSignatureRequest!,
              metadata: { SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS: signedDocExternalId },
            },
            {
              signal: abort.signal,
              onProgress: ({ loaded, total }) =>
                setProgress((uploaded + (loaded / total) * 0.5) / totalFiles),
            }
          );
          setProgress(++uploaded / totalFiles);
        }

        await cuatrecasasExport.exportPdfDocument(petition, {
          signal: abort.signal,
          onProgress: ({ loaded, total }) =>
            setProgress((uploaded + (loaded / total) * 0.5) / totalFiles),
        });
        setProgress(++uploaded / totalFiles);

        setState("FINISHED");
      } catch (e: any) {
        if (e.message !== "CANCEL") {
          return await processError(e);
        }
      }
    }
    if (data && !isRunning.current) {
      isRunning.current = true;
      exportReplies().then();
    }
  }, [data, placeholdersRename]);

  return (
    <BaseDialog
      {...props}
      closeOnEsc={state !== "UPLOADING"}
      closeOnOverlayClick={state !== "UPLOADING"}
    >
      {state === "LOADING" ? (
        <ModalContent>
          <ModalBody>
            <Center minHeight={64}>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="primary.500"
                size="xl"
              />
            </Center>
          </ModalBody>
        </ModalContent>
      ) : state === "FINISHED" ? (
        <ModalContent>
          <ModalHeader as={Stack} alignItems="center" paddingTop={8} paddingBottom={3}>
            <Center backgroundColor="green.500" borderRadius="full" boxSize="32px">
              <CheckIcon color="white" boxSize="20px" />
            </Center>
            <Text>
              <FormattedMessage
                id="component.export-replies-progress-dialog.exported-header"
                defaultMessage="Export finished successfully!"
              />
            </Text>
          </ModalHeader>
          <ModalBody>
            <Stack spacing={6} marginBottom={6} alignItems="center">
              <Text textAlign="center">
                <FormattedMessage
                  id="component.export-replies-progress-dialog.exported-text"
                  defaultMessage="Your files have been exported successfully."
                />
              </Text>
              <Button colorScheme="primary" onClick={() => props.onResolve()}>
                <FormattedMessage id="generic.continue" defaultMessage="Continue" />
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      ) : state === "UPLOADING" ? (
        <ModalContent>
          <ModalHeader as={Stack} spacing={4} alignItems="center" paddingTop={8} paddingBottom={3}>
            <CloudUploadIcon fontSize="32px" color="gray.400" />
            <Text>
              <FormattedMessage
                id="component.export-replies-progress-dialog.exporting-header"
                defaultMessage="We are exporting your files..."
              />
            </Text>
          </ModalHeader>
          <ModalBody>
            <Stack>
              <Stack direction="row" alignItems="center">
                <Progress value={progress * 100} colorScheme="green" borderRadius="md" flex="1" />
                <Box width={10} textAlign="right" fontSize="sm">
                  <FormattedNumber value={progress} style="percent" />
                </Box>
              </Stack>
              <Text textAlign="center">
                <FormattedMessage
                  id="component.export-replies-progress-dialog.exporting-text"
                  defaultMessage="Please wait a moment until the export is completed."
                />
              </Text>
            </Stack>
          </ModalBody>
          <ModalFooter as={Stack} direction="row">
            <Button
              onClick={() => {
                abort.abort();
              }}
            >
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          </ModalFooter>
        </ModalContent>
      ) : null}
    </BaseDialog>
  );

  async function processError(e: any) {
    if (e.name === "AbortError") {
      props.onReject("CANCEL");
    } else if (e?.ErrorMessage?.startsWith("NDError")) {
      props.onReject("ERROR");
      try {
        await showErrorDialog({
          message: intl.formatMessage({
            id: "component.export-replies-progress-dialog.netdocuments-error",
            defaultMessage:
              "We couldn't upload the file to the specified client folder. Please make sure that you entered the correct client number and that you have the necessary permissions.",
          }),
        });
      } catch {}
    }
  }
}

ExportRepliesProgressDialog.fragments = {
  Petition: gql`
    fragment ExportRepliesProgressDialog_Petition on Petition {
      id
      ...useCuatrecasasExport_Petition
      currentSignatureRequest {
        id
        metadata
        signedDocumentFilename
        auditTrailFilename
        status
      }
      fields {
        ...useFilenamePlaceholdersRename_PetitionField
        replies {
          ...useFilenamePlaceholdersRename_PetitionFieldReply
        }
      }
    }
    ${useCuatrecasasExport.fragments.Petition}
    ${useFilenamePlaceholdersRename.fragments.PetitionField}
    ${useFilenamePlaceholdersRename.fragments.PetitionFieldReply}
  `,
};

ExportRepliesProgressDialog.queries = [
  gql`
    query ExportRepliesProgressDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...ExportRepliesProgressDialog_Petition
      }
    }
    ${ExportRepliesProgressDialog.fragments.Petition}
  `,
];

export function useExportRepliesProgressDialog() {
  return useDialog(ExportRepliesProgressDialog);
}
