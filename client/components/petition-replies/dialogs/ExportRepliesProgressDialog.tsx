import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Checkbox,
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
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { NormalLink } from "@parallel/components/common/Link";
import {
  ExportRepliesProgressDialog_fileUploadReplyDownloadLinkDocument,
  ExportRepliesProgressDialog_petitionDocument,
  ExportRepliesProgressDialog_signedPetitionDownloadLinkDocument,
  ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataDocument,
  ExportRepliesProgressDialog_updateSignatureRequestMetadataDocument,
} from "@parallel/graphql/__types";
import { useFilenamePlaceholdersRename } from "@parallel/utils/useFilenamePlaceholders";
import deepmerge from "deepmerge";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";

export interface ExportRepliesProgressDialogProps {
  externalClientId: string;
  petitionId: string;
  pattern: string;
}

function exportFile(
  url: string,
  fileName: string,
  externalClientId: string,
  signal: AbortSignal,
  onProgress: (event: ProgressEvent) => void
) {
  return new Promise<string>((resolve, reject) => {
    const download = new XMLHttpRequest();
    signal.addEventListener("abort", () => download.abort());
    download.open("GET", url);
    download.responseType = "blob";
    download.onprogress = function (e) {
      onProgress(e);
    };
    download.onload = async function () {
      const body = new FormData();
      body.append("IdClient", externalClientId);
      body.append("IdMatter", "CLIENT_INFO");
      body.append("IdArea", "");
      body.append("IdAdminGroup", "");
      body.append("Folder", "");
      body.append("DocType", "41");
      body.append("File", new File([this.response], fileName));
      try {
        const res = await fetch("https://localhost:50500/api/v1/netdocuments/uploaddocument", {
          method: "POST",
          body,
          headers: new Headers({ AppName: "Parallel" }),
          signal,
        });
        const result = await res.json();
        if (res.ok) {
          resolve(result.IdND);
        } else {
          reject(result);
        }
      } catch (e: any) {
        reject(e);
      }
    };
    download.send();
  });
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
  const [fileUploadReplyDownloadLink] = useMutation(
    ExportRepliesProgressDialog_fileUploadReplyDownloadLinkDocument
  );
  const [signedPetitionDownloadLink] = useMutation(
    ExportRepliesProgressDialog_signedPetitionDownloadLinkDocument
  );
  const [updatePetitionFieldReplyMetadata] = useMutation(
    ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataDocument
  );
  const [updateSignatureRequestMetadata] = useMutation(
    ExportRepliesProgressDialog_updateSignatureRequestMetadataDocument
  );
  const { current: abort } = useRef(new AbortController());
  const showAlreadyExported = useDialog(AlreadyExportedDialog);
  const showErrorDialog = useErrorDialog();
  useEffect(() => {
    async function exportReplies() {
      const petition = data!.petition!;
      if (petition.__typename !== "Petition") {
        return;
      }
      const rename = placeholdersRename(petition.fields);
      const files = petition.fields.flatMap((field) =>
        field.type === "FILE_UPLOAD" ? field.replies.map((reply) => ({ reply, field })) : []
      );

      const signatureDocs = [];
      if (petition.currentSignatureRequest?.status === "COMPLETED") {
        signatureDocs.push({
          type: "signed-document",
          externalId:
            petition.currentSignatureRequest.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS,
          filename: petition.currentSignatureRequest.signedDocumentFilename!,
        });

        // audit trail may not be able to export at the time
        if (petition.currentSignatureRequest.auditTrailFilename) {
          signatureDocs.push({
            type: "audit-trail",
            externalId:
              petition.currentSignatureRequest.metadata.AUDIT_TRAIL_EXTERNAL_ID_CUATRECASAS,
            filename: petition.currentSignatureRequest.auditTrailFilename,
          });
        }
      }

      const totalFiles = files.length + signatureDocs.length;

      setState("UPLOADING");
      let uploaded = 0;
      let dontAskAgain = false;
      let exportAgain = false;
      for (const { reply, field } of files) {
        if (reply.metadata.EXTERNAL_ID_CUATRECASAS) {
          if (!dontAskAgain) {
            const result = await showAlreadyExported({
              filename: reply.content.filename,
              externalId: reply.metadata.EXTERNAL_ID_CUATRECASAS,
            });
            dontAskAgain = result.dontAskAgain;
            exportAgain = result.exportAgain;
          }
          if (!exportAgain) {
            continue;
          }
        }
        if (abort.signal.aborted) {
          props.onReject("CANCEL");
          return;
        }
        const res = await fileUploadReplyDownloadLink({
          variables: {
            petitionId: petition.id,
            replyId: reply.id,
          },
        });
        try {
          const externalId = await exportFile(
            res.data!.fileUploadReplyDownloadLink.url!,
            rename(field, reply, pattern),
            externalClientId,
            abort.signal,
            ({ loaded, total }) => setProgress((uploaded + (loaded / total) * 0.5) / totalFiles)
          );
          await updatePetitionFieldReplyMetadata({
            variables: {
              petitionId: petition.id,
              replyId: reply.id,
              metadata: {
                ...reply.metadata,
                EXTERNAL_ID_CUATRECASAS: externalId,
              },
            },
          });
        } catch (e: any) {
          return await processError(e);
        }
        uploaded += 1;
        setProgress(uploaded / totalFiles);
      }

      for (const signatureDoc of signatureDocs) {
        if (signatureDoc.externalId) {
          if (!dontAskAgain) {
            const result = await showAlreadyExported({
              filename: signatureDoc.filename!,
              externalId: signatureDoc.externalId,
            });
            dontAskAgain = result.dontAskAgain;
            exportAgain = result.exportAgain;
          }
          if (!exportAgain) {
            continue;
          }
        }
        if (abort.signal.aborted) {
          props.onReject("CANCEL");
          return;
        }
        const res = await signedPetitionDownloadLink({
          variables: {
            petitionSignatureRequestId: petition.currentSignatureRequest!.id,
            downloadAuditTrail: signatureDoc.type === "audit-trail",
          },
        });
        try {
          const externalId = await exportFile(
            res.data!.signedPetitionDownloadLink.url!,
            signatureDoc.filename!,
            externalClientId,
            abort.signal,
            ({ loaded, total }) => setProgress((uploaded + (loaded / total) * 0.5) / totalFiles)
          );

          await updateSignatureRequestMetadata({
            variables: {
              petitionSignatureRequestId: petition.currentSignatureRequest!.id,
              metadata: deepmerge(
                petition.currentSignatureRequest!.metadata,
                signatureDoc.type === "signed-document"
                  ? {
                      SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS: externalId,
                    }
                  : {
                      AUDIT_TRAIL_EXTERNAL_ID_CUATRECASAS: externalId,
                    }
              ),
            },
          });
        } catch (e: any) {
          return await processError(e);
        }
        uploaded += 1;
        setProgress(uploaded / totalFiles);
      }
      setState("FINISHED");
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
                color="purple.500"
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
              <Button colorScheme="purple" onClick={() => props.onResolve()}>
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
      fields {
        id
        type
        ...useFilenamePlaceholdersRename_PetitionField
        replies {
          id
          metadata
          ...useFilenamePlaceholdersRename_PetitionFieldReply
        }
      }
      currentSignatureRequest {
        id
        status
        signedDocumentFilename
        auditTrailFilename
        metadata
      }
    }
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

ExportRepliesProgressDialog.mutations = [
  gql`
    mutation ExportRepliesProgressDialog_fileUploadReplyDownloadLink(
      $petitionId: GID!
      $replyId: GID!
    ) {
      fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId) {
        result
        url
      }
    }
  `,
  gql`
    mutation ExportRepliesProgressDialog_signedPetitionDownloadLink(
      $petitionSignatureRequestId: GID!
      $downloadAuditTrail: Boolean
    ) {
      signedPetitionDownloadLink(
        petitionSignatureRequestId: $petitionSignatureRequestId
        downloadAuditTrail: $downloadAuditTrail
      ) {
        result
        url
      }
    }
  `,
  gql`
    mutation ExportRepliesProgressDialog_updatePetitionFieldReplyMetadata(
      $petitionId: GID!
      $replyId: GID!
      $metadata: JSONObject!
    ) {
      updatePetitionFieldReplyMetadata(
        petitionId: $petitionId
        replyId: $replyId
        metadata: $metadata
      ) {
        id
        metadata
      }
    }
  `,
  gql`
    mutation ExportRepliesProgressDialog_updateSignatureRequestMetadata(
      $petitionSignatureRequestId: GID!
      $metadata: JSONObject!
    ) {
      updateSignatureRequestMetadata(
        petitionSignatureRequestId: $petitionSignatureRequestId
        metadata: $metadata
      ) {
        id
        metadata
      }
    }
  `,
];

export function useExportRepliesProgressDialog() {
  return useDialog(ExportRepliesProgressDialog);
}

interface AlreadyExportedDialogProps {
  filename: string;
  externalId: string;
}

function AlreadyExportedDialog({
  externalId,
  filename,
  ...props
}: DialogProps<AlreadyExportedDialogProps, { dontAskAgain: boolean; exportAgain: boolean }>) {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      {...props}
      header={
        <FormattedMessage
          id="component.export-replies-progress-dialog.header"
          defaultMessage="This file has already been exported"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.export-replies-progress-dialog.body-1"
              defaultMessage="The file {filename} has already been exported to NetDocuments"
              values={{ filename: <Text as="strong">{filename}</Text> }}
            />
          </Text>
          <Text textAlign="center">
            <NormalLink
              href={`https://eu.netdocuments.com/neWeb2/goid.aspx?id=${externalId}`}
              isExternal
            >
              <FormattedMessage
                id="component.export-replies-progress-dialog.open-file"
                defaultMessage="Open file in NetDocuments"
              />
            </NormalLink>
          </Text>
          <Text>
            <FormattedMessage
              id="component.export-replies-progress-dialog.body2"
              defaultMessage="Do you want to export it again?"
            />
          </Text>
          <Checkbox isChecked={dontAskAgain} onChange={(e) => setDontAskAgain(e.target.checked)}>
            <FormattedMessage id="generic.dont-ask-again" defaultMessage="Don't ask again" />
          </Checkbox>
        </Stack>
      }
      cancel={
        <Button onClick={() => props.onResolve({ dontAskAgain, exportAgain: false })}>
          <FormattedMessage id="generic.omit" defaultMessage="Omit" />
        </Button>
      }
      confirm={
        <Button
          colorScheme="purple"
          onClick={() => props.onResolve({ dontAskAgain, exportAgain: true })}
        >
          <FormattedMessage
            id="component.export-replies-progress-dialog.export-again"
            defaultMessage="Export again"
          />
        </Button>
      }
    />
  );
}
