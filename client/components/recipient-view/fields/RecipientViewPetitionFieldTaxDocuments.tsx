import { Box, Button, HStack, List, Progress, Stack, Text } from "@chakra-ui/react";
import { ExclamationOutlineIcon } from "@parallel/chakra/icons";
import { useTone } from "@parallel/components/common/ToneProvider";
import { centeredPopup, openNewWindow } from "@parallel/utils/openNewWindow";
import { useInterval } from "@parallel/utils/useInterval";
import { useWindowEvent } from "@parallel/utils/useWindowEvent";
import { isDefined } from "@udecode/plate-common";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useOverwriteDocumentationDialog } from "../dialogs/OverwriteDocumentationDialog";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
} from "./RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldReplyFileUpload } from "./RecipientViewPetitionFieldFileUpload";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";

export interface RecipientViewPetitionFieldTaxDocumentsProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onDownloadReply: (replyId: string) => void;
  isCacheOnly?: boolean;
  onStartAsyncFieldCompletion: () => Promise<{ type: string; url: string }>;
  onRefreshField: () => void;
  isInvalid?: boolean;
}

export function RecipientViewPetitionFieldTaxDocuments({
  field,
  isDisabled,
  onDeleteReply,
  onDownloadAttachment,
  onDownloadReply,
  onCommentsButtonClick,
  onStartAsyncFieldCompletion,
  onRefreshField,
  isInvalid,
  isCacheOnly,
}: RecipientViewPetitionFieldTaxDocumentsProps) {
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});

  const handleDeletePetitionReply = useCallback(
    async function handleDeletePetitionReply({ replyId }: { replyId: string }) {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
    },
    [onDeleteReply],
  );
  const tone = useTone();
  const [state, setState] = useState<"IDLE" | "ERROR" | "FETCHING">("IDLE");

  // ready means bankflip exported all requested docs and sent event to our webhook to start uploading replies
  const [bankflipSessionReady, setBankflipSessionReady] = useState(false);

  const showOverwriteDocumentationDialog = useOverwriteDocumentationDialog();

  const popupRef = useRef<Window>();
  useInterval(
    async (done) => {
      if (field.replies.length > 0) {
        setState("IDLE");
        done();
      } else if (state === "FETCHING") {
        if (isDefined(popupRef.current) && popupRef.current.closed && !bankflipSessionReady) {
          setState("IDLE");
          done();
        } else {
          onRefreshField();
        }
      } else {
        done();
      }
    },
    5000,
    [onRefreshField, state, field.replies.length, bankflipSessionReady],
  );

  useWindowEvent(
    "message",
    (e) => {
      const popup = popupRef.current;
      if (isDefined(popup) && e.source === popup) {
        if (e.data.name === "session_completed") {
          setBankflipSessionReady(true);
        }
        if (e.data.name === "user_requested_closure") {
          onRefreshField();
          popup.close();
        }
        if (e.data.name === "session_expired") {
          popup.close();
          setState("ERROR");
        }
      }
    },
    [onRefreshField],
  );

  const handleStart = async () => {
    try {
      // just to make sure there is always only 1 reply
      for (const reply of field.replies) {
        await handleDeletePetitionReply({ replyId: reply.id });
      }
      setBankflipSessionReady(false);
      setState("FETCHING");
      popupRef.current = await openNewWindow(
        async () => {
          const data = await onStartAsyncFieldCompletion();
          if (data.type === "CACHE") {
            throw new Error("CLOSE");
          } else {
            return data!.url;
          }
        },
        centeredPopup({ height: 800, width: 700 }),
      );
      if (isCacheOnly) {
        setState("IDLE");
      }
    } catch {
      setState("ERROR");
    }
  };

  const handleStartAgain = async () => {
    try {
      await showOverwriteDocumentationDialog({ tone });
      await handleStart();
    } catch {}
  };

  const handleCancelClick = () => {
    setState("IDLE");
    popupRef.current?.close();
  };
  const fieldReplies = completedFieldReplies(field);

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment}
    >
      <Text fontSize="sm" color="gray.600">
        <>
          <FormattedMessage
            id="component.recipient-view-petition-field-tax-documents.follow-steps-description"
            defaultMessage="Follow the steps to upload the documentation you need."
            values={{ tone }}
          />
          {fieldReplies.length ? (
            <>
              {" ("}
              <FormattedMessage
                id="component.recipient-view-petition-field-card.files-uploaded"
                defaultMessage="{count, plural, =0 {No files have been uploaded yet} =1 {1 file uploaded} other {# files uploaded}}"
                values={{ count: fieldReplies.length }}
              />
              {")"}
            </>
          ) : null}
        </>
      </Text>

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
                  id={`reply-${field.id}-${reply.id}`}
                  type="ES_TAX_DOCUMENTS"
                  reply={reply}
                  isDisabled={isDisabled || isDeletingReply[reply.id]}
                  onRemove={() => handleDeletePetitionReply({ replyId: reply.id })}
                  onDownload={onDownloadReply}
                  isDownloadDisabled={isCacheOnly || reply.isAnonymized}
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
            isDisabled={
              isDisabled ||
              state === "FETCHING" ||
              field.replies.some((r) => r.status === "APPROVED")
            }
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
            isDisabled={state === "FETCHING" || isDisabled}
            outlineColor={state !== "FETCHING" && isInvalid ? "red.500" : undefined}
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
          <HStack>
            <Progress
              size="md"
              isIndeterminate
              colorScheme="green"
              borderRadius="full"
              width="100%"
            />
            <Button size="sm" fontWeight="normal" onClick={handleCancelClick}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          </HStack>
        </Stack>
      ) : null}
    </RecipientViewPetitionFieldLayout>
  );
}
