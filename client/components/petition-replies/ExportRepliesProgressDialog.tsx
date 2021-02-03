import { gql } from "@apollo/client";
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
import {
  useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation,
  useExportRepliesProgressDialog_PetitionRepliesQuery,
  useExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation,
} from "@parallel/graphql/__types";
import { useFilenamePlaceholdersRename } from "@parallel/utils/useFilenamePlaceholders";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { BaseDialog } from "../common/BaseDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";

export interface ExportRepliesProgressDialogProps {
  petitionId: string;
  pattern: string;
}

function exportFile(
  url: string,
  fileName: string,
  onProgress: (event: ProgressEvent) => void
) {
  const download = new XMLHttpRequest();
  return new Promise<string>((resolve) => {
    download.open("GET", url);
    download.responseType = "blob";
    download.onprogress = function (e) {
      onProgress(e);
    };
    download.onload = async function () {
      const body = new FormData();
      body.append("IdClient", "999999");
      body.append("IdMatter", "00001");
      body.append("IdArea", "");
      body.append("IdAdminGroup", "");
      body.append("Folder", "");
      body.append("DocType", "41");
      body.append("File", new File([this.response], fileName));
      const res = await fetch(
        "https://localhost:50500/api/v1/netdocuments/uploaddocument",
        {
          method: "POST",
          body,
          headers: new Headers({ AppName: "Parallel" }),
        }
      );
      const result = await res.json();
      resolve(result.IdND);
    };
    download.send();
  });
}

export function ExportRepliesProgressDialog({
  petitionId,
  pattern,
  ...props
}: DialogProps<ExportRepliesProgressDialogProps>) {
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<
    "LOADING" | "UPLOADING" | "FINISHED" | "NOTHING"
  >("LOADING");
  const { data } = useExportRepliesProgressDialog_PetitionRepliesQuery({
    variables: { petitionId },
  });
  const isRunning = useRef(false);
  const placeholdersRename = useFilenamePlaceholdersRename();
  const [
    fileUploadReplyDownloadLink,
  ] = useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation();
  const [
    updatePetitionFieldReplyMetadata,
  ] = useExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation();
  useEffect(() => {
    async function exportReplies() {
      const petition = data!.petition!;
      if (petition.__typename !== "Petition") {
        return;
      }
      const rename = placeholdersRename(petition.fields);
      const files = petition.fields
        .flatMap((field) =>
          field.type === "FILE_UPLOAD"
            ? field.replies.map((reply) => ({ reply, field }))
            : []
        )
        .filter(({ reply }) => !reply.metadata.EXTERNAL_ID_CUATRECASAS);
      if (files.length === 0) {
        setState("NOTHING");
      } else {
        setState("UPLOADING");
        let uploaded = 0;
        for (const { reply, field } of files) {
          const res = await fileUploadReplyDownloadLink({
            variables: {
              petitionId: petition.id,
              replyId: reply.id,
            },
          });
          const externalId = await exportFile(
            res.data!.fileUploadReplyDownloadLink.url!,
            rename(field, reply, pattern),
            ({ loaded, total }) =>
              setProgress((uploaded + (loaded / total) * 0.5) / files.length)
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
          uploaded += 1;
          setProgress(uploaded / files.length);
        }
        setState("FINISHED");
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
                color="purple.500"
                size="xl"
              />
            </Center>
          </ModalBody>
        </ModalContent>
      ) : state === "FINISHED" ? (
        <ModalContent>
          <ModalHeader
            as={Stack}
            alignItems="center"
            paddingTop={8}
            paddingBottom={3}
          >
            <Center
              backgroundColor="green.500"
              borderRadius="full"
              boxSize="32px"
            >
              <CheckIcon color="white" boxSize="20px" />
            </Center>
            <Text>
              <FormattedMessage
                id="component.reply-export-dialog.exported-header"
                defaultMessage="Export finished successfully!"
              />
            </Text>
          </ModalHeader>
          <ModalBody>
            <Stack spacing={4} marginBottom={6} alignItems="center">
              <Text textAlign="center">
                <FormattedMessage
                  id="component.reply-export-dialog.exported-text"
                  defaultMessage="Your files have been exported successfully"
                />
              </Text>
              <Button colorScheme="purple" onClick={() => props.onResolve()}>
                <FormattedMessage
                  id="generic.continue"
                  defaultMessage="Continue"
                />
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      ) : state === "UPLOADING" ? (
        <ModalContent>
          <ModalHeader
            as={Stack}
            spacing={4}
            alignItems="center"
            paddingTop={8}
            paddingBottom={3}
          >
            <CloudUploadIcon fontSize="32px" color="gray.400" />
            <Text>
              <FormattedMessage
                id="component.reply-export-dialog.exporting-header"
                defaultMessage="We are exporting your files..."
              />
            </Text>
          </ModalHeader>
          <ModalBody>
            <Stack>
              <Stack direction="row" alignItems="center">
                <Progress
                  value={progress * 100}
                  colorScheme="green"
                  borderRadius="md"
                  flex="1"
                />
                <Box width={10} textAlign="right" fontSize="sm">
                  <FormattedNumber value={progress} style="percent" />
                </Box>
              </Stack>
              <Text textAlign="center">
                <FormattedMessage
                  id="component.reply-export-dialog.exporting-text"
                  defaultMessage="Please wait a moment until the export is completed."
                />
              </Text>
            </Stack>
          </ModalBody>
          <ModalFooter as={Stack} direction="row">
            <Button onClick={() => props.onReject({ reason: "CANCEL" })}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          </ModalFooter>
        </ModalContent>
      ) : state === "NOTHING" ? (
        <ModalContent>
          <ModalHeader
            as={Stack}
            alignItems="center"
            paddingTop={8}
            paddingBottom={3}
          >
            <Center
              backgroundColor="green.500"
              borderRadius="full"
              boxSize="32px"
            >
              <CheckIcon color="white" boxSize="20px" />
            </Center>
            <Text>
              <FormattedMessage
                id="component.reply-export-dialog.nothing-header"
                defaultMessage="All files have already been exported"
              />
            </Text>
          </ModalHeader>
          <ModalBody>
            <Stack spacing={4} marginBottom={6} alignItems="center">
              <Text textAlign="center">
                <FormattedMessage
                  id="component.reply-export-dialog.nothing-text"
                  defaultMessage="Your files have have already been successfully"
                />
              </Text>
              <Button colorScheme="purple" onClick={() => props.onResolve()}>
                <FormattedMessage
                  id="generic.continue"
                  defaultMessage="Continue"
                />
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      ) : null}
    </BaseDialog>
  );
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
    }
    ${useFilenamePlaceholdersRename.fragments.PetitionField}
    ${useFilenamePlaceholdersRename.fragments.PetitionFieldReply}
  `,
};

ExportRepliesProgressDialog.queries = [
  gql`
    query ExportRepliesProgressDialog_PetitionReplies($petitionId: GID!) {
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
];

export function useExportRepliesProgressDialog() {
  return useDialog(ExportRepliesProgressDialog);
}
