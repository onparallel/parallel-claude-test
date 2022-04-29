import { Box, Button, HStack, List, Progress, Stack, Text } from "@chakra-ui/react";
import { ExclamationOutlineIcon } from "@parallel/chakra/icons";
import { Tone } from "@parallel/graphql/__types";
import { centeredPopup, openNewWindow } from "@parallel/utils/openNewWindow";
import { useInterval } from "@parallel/utils/useInterval";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
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
  onDeleteReply: (replyId: string) => void;
  onDownloadReply: (replyId: string) => void;
  isCacheOnly?: boolean;
  onStartAsyncFieldCompletion: () => Promise<{ type: string; url: string }>;
  onRefreshField: () => void;
}

export function RecipientViewPetitionFieldTaxDocuments({
  field,
  isDisabled,
  isInvalid,
  tone,
  onDeleteReply,
  onDownloadAttachment,
  onDownloadReply,
  onCommentsButtonClick,
  onStartAsyncFieldCompletion,
  onRefreshField,
  isCacheOnly,
}: RecipientViewPetitionFieldTaxDocumentsProps) {
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});

  const handleDeletePetitionReply = useCallback(
    async function handleDeletePetitionReply({ replyId }: { replyId: string }) {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
    },
    [onDeleteReply]
  );

  const [state, setState] = useState<"IDLE" | "ERROR" | "FETCHING">("IDLE");

  const showOverwriteDocumentationDialog = useOverwriteDocumentationDialog();

  useInterval(async (done) => {
    if (field.replies.length === 0) {
      onRefreshField();
    } else {
      done();
    }
  }, 10000);

  const handleStart = async () => {
    try {
      setState("FETCHING");
      const popup = await openNewWindow(async () => {
        const data = await onStartAsyncFieldCompletion();
        return data!.url;
      }, centeredPopup({ height: 800, width: 700 }));
      window.addEventListener("message", (e) => {
        if (e.data.name === "success") {
          onRefreshField();
          popup?.close();
        }
      });
      setState("IDLE");
    } catch {
      setState("ERROR");
    }
  };

  const handleStartAgain = async () => {
    try {
      await showOverwriteDocumentationDialog({ tone });
      for (const reply of field.replies) {
        await handleDeletePetitionReply({ replyId: reply.id });
      }
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
      {field.replies.length ? (
        <List as={Stack} paddingY={1}>
          <AnimatePresence initial={false}>
            {field.replies.map((reply) => (
              <motion.li
                key={reply.id}
                layout
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0, transition: { ease: "easeOut" } }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <RecipientViewPetitionFieldReplyFileUpload
                  reply={reply}
                  isDisabled={isDisabled || isDeletingReply[reply.id]}
                  onRemove={() =>
                    handleDeletePetitionReply({
                      replyId: reply.id,
                    })
                  }
                  onDownload={onDownloadReply}
                  isDownloadDisabled={isCacheOnly}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      <Box marginTop={2}>
        {field.replies.length ? (
          <Button
            variant="outline"
            width="min-content"
            onClick={handleStartAgain}
            isDisabled={state === "FETCHING" || field.replies.some((r) => r.status === "APPROVED")}
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
