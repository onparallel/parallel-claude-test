import { Box, Button, Flex, HStack, List, Progress, Stack, Text } from "@chakra-ui/react";
import { ExclamationOutlineIcon } from "@parallel/chakra/icons";
import { useTone } from "@parallel/components/common/ToneProvider";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { centeredPopup, isWindowBlockedError, openNewWindow } from "@parallel/utils/openNewWindow";
import { useInterval } from "@parallel/utils/useInterval";
import { useWindowEvent } from "@parallel/utils/useWindowEvent";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { isNonNullish, pick, zip } from "remeda";
import { useEsTaxDocumentsChangePersonDialog } from "../dialogs/EsTaxDocumentsChangePersonDialog";
import { RecipientViewPetitionFieldReplyFileUpload } from "./RecipientViewPetitionFieldFileUpload";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
} from "./RecipientViewPetitionFieldLayout";

export interface RecipientViewPetitionFieldTaxDocumentsProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => Promise<void>;
  onDownloadReply: (replyId: string) => void;
  isCacheOnly?: boolean;
  onStartAsyncFieldCompletion: () => Promise<{ type: string; url: string }>;
  onRetryAsyncFieldCompletion: () => Promise<{ type: string; url: string }>;
  onRefreshField: () => void;
  onError: (error: any) => void;
  isInvalid?: boolean;
  hideDeleteReplyButton?: boolean;
  parentReplyId?: string;
}

export function RecipientViewPetitionFieldTaxDocuments({
  field,
  isDisabled,
  onDeleteReply,
  onDownloadAttachment,
  onDownloadReply,
  onCommentsButtonClick,
  onStartAsyncFieldCompletion,
  onRetryAsyncFieldCompletion,
  onRefreshField,
  onError,
  isInvalid,
  isCacheOnly,
  hideDeleteReplyButton,
  parentReplyId,
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
  const [state, setState] = useState<"IDLE" | "ERROR" | "FETCHING" | "FIELD_ALREADY_REPLIED_ERROR">(
    "IDLE",
  );
  const [requestType, setRequestType] = useState<"START" | "RETRY" | null>(null);

  useEffect(() => {
    if (state === "FIELD_ALREADY_REPLIED_ERROR") {
      setState("IDLE");
    }
  }, [field.replies]);

  // ready means bankflip exported all requested docs and sent event to our webhook to start uploading replies
  const [bankflipSessionReady, setBankflipSessionReady] = useState(false);

  const [repliesBefore, setRepliesBefore] = useState(
    field.replies.map((r) => ({ id: r.id, updatedAt: r.updatedAt })),
  );

  const popupRef = useRef<Window>();
  useInterval(
    async (done) => {
      const someChange =
        field.replies.length !== repliesBefore.length ||
        zip(
          repliesBefore,
          field.replies.map((r) => pick(r, ["id", "updatedAt"])),
        ).some(([before, after]) => {
          return before.updatedAt !== after.updatedAt;
        });

      if (
        (requestType === "START" && field.replies.length > 0 && bankflipSessionReady) ||
        (requestType === "RETRY" && someChange && bankflipSessionReady)
      ) {
        setState("IDLE");
        done();
      } else if (state === "FETCHING") {
        if (isNonNullish(popupRef.current) && popupRef.current.closed && !bankflipSessionReady) {
          setState("IDLE");
          done();
        } else {
          setRepliesBefore(field.replies.map((r) => pick(r, ["id", "updatedAt"])));
          onRefreshField();
        }
      } else {
        done();
      }
    },
    5000,
    [
      onRefreshField,
      state,
      field.replies.map((r) => r.id + "-" + r.updatedAt).join(","),
      bankflipSessionReady,
    ],
  );

  useWindowEvent(
    "message",
    (e) => {
      const popup = popupRef.current;
      if (isNonNullish(popup) && e.source === popup) {
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
      setRequestType("START");
      setState("FETCHING");
      popupRef.current = await openNewWindow(
        async () => {
          const data = await onStartAsyncFieldCompletion();
          return data!.url;
        },
        centeredPopup({ height: 800, width: 700 }),
      );
      if (isCacheOnly) {
        popupRef.current.close();
        setState("IDLE");
      }
    } catch (e) {
      if (!isWindowBlockedError(e)) {
        onError(e);
        if (isApolloError(e, "FIELD_ALREADY_REPLIED_ERROR")) {
          setState("FIELD_ALREADY_REPLIED_ERROR");
        } else {
          setState("ERROR");
        }
      }
    }
  };

  const handleRetryRequest = async () => {
    try {
      setBankflipSessionReady(false);
      setRequestType("RETRY");
      setState("FETCHING");
      popupRef.current = await openNewWindow(
        async () => {
          const data = await onRetryAsyncFieldCompletion();
          return data!.url;
        },
        centeredPopup({ height: 800, width: 700 }),
      );
      if (isCacheOnly) {
        popupRef.current.close();
        setState("IDLE");
      }
    } catch {}
  };

  const hasErrorDocuments = field.replies.some(
    (r) =>
      ((isNonNullish(r.content.error) &&
        Array.isArray(r.content.error) &&
        r.content.error[0]?.reason !== "document_not_found") ||
        isNonNullish(r.content.warning)) &&
      r.status !== "APPROVED",
  );

  const showChangePersonDialog = useEsTaxDocumentsChangePersonDialog();

  const handleChangePerson = async () => {
    try {
      await showChangePersonDialog({ tone });
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
                  id={`reply-${field.id}${reply.parent ? `-${reply.parent.id}` : ""}-${reply.id}`}
                  type="ES_TAX_DOCUMENTS"
                  reply={reply}
                  isDisabled={isDisabled || isDeletingReply[reply.id]}
                  onRemove={
                    !hideDeleteReplyButton
                      ? () => handleDeletePetitionReply({ replyId: reply.id })
                      : undefined
                  }
                  onDownload={onDownloadReply}
                  isDownloadDisabled={isCacheOnly || reply.isAnonymized}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      <Flex marginTop={2} justifyContent="space-between" alignItems="baseline">
        {hasErrorDocuments ? (
          <Button
            variant="outline"
            width="min-content"
            onClick={handleRetryRequest}
            isDisabled={isDisabled || state === "FETCHING"}
          >
            <FormattedMessage
              id="component.recipient-view-petition-field-tax-documents.retry-button"
              defaultMessage="Retry"
            />
          </Button>
        ) : field.replies.length === 0 ? (
          <Button
            variant="outline"
            width="min-content"
            onClick={handleStart}
            isDisabled={state === "FETCHING" || isDisabled}
            outlineColor={state !== "FETCHING" && isInvalid ? "red.500" : undefined}
            id={`reply-${field.id}${parentReplyId ? `-${parentReplyId}` : ""}-new`}
          >
            <FormattedMessage
              id="component.recipient-view-petition-field-tax-documents.start-button"
              defaultMessage="Start"
            />
          </Button>
        ) : (
          <Box />
        )}
        {field.replies.length > 0 && state === "IDLE" ? (
          <Button variant="link" onClick={handleChangePerson}>
            <FormattedMessage
              id="component.recipient-view-petition-field-tax-documents.change-person-button"
              defaultMessage="Change person"
            />
          </Button>
        ) : null}
      </Flex>
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
      ) : state === "FIELD_ALREADY_REPLIED_ERROR" ? (
        <HStack alignItems="center" marginTop={2} color="red.600">
          <ExclamationOutlineIcon boxSize={4} />
          <Text fontSize="sm">
            <FormattedMessage
              id="component.recipient-view-petition-field-tax-documents.error-field-already-replied"
              defaultMessage="There is already a reply for this field."
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
