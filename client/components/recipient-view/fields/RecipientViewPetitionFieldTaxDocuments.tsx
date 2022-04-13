import { Box, Button, HStack, List, Progress, Stack, Text } from "@chakra-ui/react";
import { ExclamationOutlineIcon } from "@parallel/chakra/icons";
import { Tone } from "@parallel/graphql/__types";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { useOverwriteDocumentationDialog } from "../dialogs/OverwriteDocumentationDialog";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyFileUpload } from "./RecipientViewPetitionFieldFileUpload";

export interface RecipientViewPetitionFieldTaxDocumentsProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  tone: Tone;
  onDownloadReply: (replyId: string) => void;
  isCacheOnly?: boolean;
}

export function RecipientViewPetitionFieldTaxDocuments({
  field,
  isDisabled,
  isInvalid,
  tone,
  onDownloadAttachment,
  onDownloadReply,
  onCommentsButtonClick,
  isCacheOnly,
}: RecipientViewPetitionFieldTaxDocumentsProps) {
  const [state, setState] = useState<"IDLE" | "ERROR" | "FETCHING">("IDLE");
  const [replies, setReplies] = useState(field.replies);

  const getData = () => {
    return new Promise((resolve, reject) => {
      const data = JSON.parse(
        `[{"__typename":"PetitionFieldReply","id":"6vyn9tAvuTWyY2CxMHHmmEh5cqqfwaC2","status":"APPROVED","content":{"filename":"import_model_es (1).xlsx","size":"9322","contentType":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","extension":"xlsx","uploadComplete":true},"createdAt":"2022-04-12T15:16:00.134Z","updatedAt":"2022-04-12T15:16:07.275Z"},{"__typename":"PetitionFieldReply","id":"6vyn9tAvuTWyY2CxMHHmmEh5cqqfwaC3","status":"REJECTED","content":{"filename":"Frame.svg","size":"637","contentType":"image/svg+xml","extension":"svg","uploadComplete":true},"createdAt":"2022-04-12T15:16:13.255Z","updatedAt":"2022-04-12T15:16:18.378Z"}]`
      );
      setTimeout(() => {
        const random = Math.floor(Math.random() * 10) + 1;
        if (random > 4) {
          resolve(data);
        }
        reject();
      }, 2000);
    });
  };

  const showOverwriteDocumentationDialog = useOverwriteDocumentationDialog();

  const handleStart = async () => {
    try {
      // do something
      setState("FETCHING");
      const data = await getData();
      setReplies(data);
      setState("IDLE");
    } catch {
      setReplies([]);
      setState("ERROR");
    }
  };

  const handleStartAgain = async () => {
    try {
      await showOverwriteDocumentationDialog({ tone });
      await handleStart();
    } catch {}
  };

  return (
    <RecipientViewPetitionFieldCard
      field={field}
      isInvalid={isInvalid}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment}
      tone={tone}
    >
      {replies.length ? (
        <List as={Stack} paddingY={1}>
          <AnimatePresence initial={false}>
            {replies.map((reply) => (
              <motion.li
                key={reply.id}
                layout
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0, transition: { ease: "easeOut" } }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <RecipientViewPetitionFieldReplyFileUpload
                  reply={reply}
                  isDisabled={isDisabled}
                  onDownload={onDownloadReply}
                  isDownloadDisabled={isCacheOnly}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      <Box marginTop={2}>
        {replies.length ? (
          <Button
            variant="outline"
            width="min-content"
            onClick={handleStartAgain}
            isDisabled={state === "FETCHING"}
          >
            <FormattedMessage
              id="component.recipient-view-petition-field-tax-documents.start-again-button"
              defaultMessage="Start again"
            />
          </Button>
        ) : (
          <Button
            variant="outline"
            width="min-content"
            onClick={handleStart}
            isDisabled={state === "FETCHING"}
          >
            <FormattedMessage
              id="component.recipient-view-petition-field-tax-documents.start-button"
              defaultMessage="Start"
            />
          </Button>
        )}
      </Box>
      {state === "ERROR" ? (
        <HStack alignItems="center" marginTop={2} color="red.600">
          <ExclamationOutlineIcon boxSize={4} />
          <Text fontSize="sm">
            <FormattedMessage
              id="component.recipient-view-petition-field-tax-documents.error-uploading"
              defaultMessage="We have not found any files. Please try again."
            />
          </Text>
        </HStack>
      ) : null}
      {state === "FETCHING" ? (
        <Stack marginTop={4}>
          <Text fontSize="sm">
            <FormattedMessage
              id="component.recipient-view-petition-field-tax-documents.loading-documentation"
              defaultMessage="Please, wait while we upload the documentation..."
              values={{ tone }}
            />
          </Text>
          <Progress size="md" isIndeterminate colorScheme="green" borderRadius="full" />
        </Stack>
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
}
