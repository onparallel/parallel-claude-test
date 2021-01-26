import { gql } from "@apollo/client";
import {
  Stack,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Button,
  Center,
  ScaleFade,
  Flex,
  Progress,
  Box,
  Text,
  Heading,
} from "@chakra-ui/react";
import { CheckIcon, CloudUploadIcon } from "@parallel/chakra/icons";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { BaseDialog } from "../common/BaseDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import {
  useExportRepliesProgressDialog_PetitionRepliesQuery,
  useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation,
} from "@parallel/graphql/__types";

export interface ExportRepliesProgressDialogProps {
  petitionId: string;
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
      resolve(await res.json());
    };
    download.send();
  });
}

export function ExportRepliesProgressDialog({
  petitionId,
  ...props
}: DialogProps<ExportRepliesProgressDialogProps>) {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const { data } = useExportRepliesProgressDialog_PetitionRepliesQuery({
    variables: { petitionId },
  });
  const isRunning = useRef(false);
  const [
    fileUploadReplyDownloadLink,
  ] = useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation();
  useEffect(() => {
    async function exportReplies() {
      const petition = data!.petition!;
      if (petition.__typename !== "Petition") {
        return;
      }
      const replies = petition.fields.flatMap((field) =>
        field.type === "FILE_UPLOAD" ? field.replies : []
      );
      let uploaded = 0;
      for (const reply of replies) {
        const res = await fileUploadReplyDownloadLink({
          variables: {
            petitionId: petition.id,
            replyId: reply.id,
          },
        });
        const response = await exportFile(
          res.data!.fileUploadReplyDownloadLink.url!,
          reply.content.filename,
          (e) =>
            setProgress(
              (uploaded + (e.loaded / e.total) * 0.5) / replies.length
            )
        );
        uploaded += 1;
        setProgress(uploaded / replies.length);
        console.log(response);
      }
      setIsFinished(true);
    }
    if (data && !isRunning.current) {
      isRunning.current = true;
      exportReplies().then();
      // setTimeout(() => setProgress(0.5), 1000);
      // setTimeout(() => setProgress(1), 2000);
      // setTimeout(() => setIsFinished(true), 3000);
    }
  }, [data]);
  return (
    <BaseDialog
      {...props}
      closeOnEsc={isFinished}
      closeOnOverlayClick={isFinished}
    >
      <ModalContent>
        {isFinished ? (
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
              <CheckIcon color="white" boxSize="24px" />
            </Center>
            <Text>
              <FormattedMessage
                id="component.reply-export-dialog.exported-header"
                defaultMessage="Export finished successfully!"
              />
            </Text>
          </ModalHeader>
        ) : (
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
        )}
        {isFinished ? (
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
        ) : (
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
        )}
        {isFinished ? null : (
          <ModalFooter as={Stack} direction="row">
            <Button onClick={() => props.onReject({ reason: "CANCEL" })}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
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
        replies {
          id
          content
        }
      }
    }
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
];

export function useExportRepliesProgressDialog() {
  return useDialog(ExportRepliesProgressDialog);
}
