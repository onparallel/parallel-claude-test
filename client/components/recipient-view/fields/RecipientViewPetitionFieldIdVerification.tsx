import { Box, Button, Center, Flex, HStack, Progress, Stack } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import {
  AlertCircleIcon,
  CheckIcon,
  CloseIcon,
  CloudOkIcon,
  ExclamationOutlineIcon,
} from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { useTone } from "@parallel/components/common/ToneProvider";
import { RestrictedPetitionFieldAlert } from "@parallel/components/petition-common/alerts/RestrictedPetitionFieldAlert";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { FORMATS } from "@parallel/utils/dates";
import { centeredPopup, isWindowBlockedError, openNewWindow } from "@parallel/utils/openNewWindow";
import { UnwrapArray } from "@parallel/utils/types";
import { useInterval } from "@parallel/utils/useInterval";
import { useWindowEvent } from "@parallel/utils/useWindowEvent";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { useRecipientViewIdVerificationStartAgainDialog } from "../dialogs/RecipientViewIdVerificationStartAgainDialog";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayout_PetitionFieldSelection,
  RecipientViewPetitionFieldLayoutProps,
} from "./RecipientViewPetitionFieldLayout";
import { Text } from "@parallel/components/ui";

export interface RecipientViewPetitionFieldIdVerificationProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  isCacheOnly?: boolean;
  onDeleteReply: (replyId: string) => Promise<void>;
  onStartAsyncFieldCompletion: () => Promise<{ type: string; url: string }>;
  onRefreshField: () => void;
  onError: (error: any) => void;
  isInvalid?: boolean;
  parentReplyId?: string;
  hasIdVerificationFeature?: boolean;
}

export function RecipientViewPetitionFieldIdVerification({
  field,
  isDisabled,
  onDownloadAttachment,
  onCommentsButtonClick,
  onStartAsyncFieldCompletion,
  onRefreshField,
  onError,
  isInvalid,
  isCacheOnly,
  parentReplyId,
  hasIdVerificationFeature,
}: RecipientViewPetitionFieldIdVerificationProps) {
  const tone = useTone();

  const filteredReplies = parentReplyId
    ? field.replies.filter((r) => r.parent?.id === parentReplyId)
    : field.replies;

  const [state, setState] = useState<"IDLE" | "ERROR" | "FETCHING">("IDLE");
  const [requestType, setRequestType] = useState<"START" | "RETRY" | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useInterval(
    async (done) => {
      if (
        (requestType === "START" && filteredReplies.length > 0 && sessionReady) ||
        (requestType === "RETRY" && sessionReady)
      ) {
        setState("IDLE");
        done();
      } else if (state === "FETCHING") {
        if (isNonNullish(popupRef.current) && popupRef.current.closed && !sessionReady) {
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
    [
      onRefreshField,
      state,
      filteredReplies.map((r) => r.id + "-" + r.updatedAt).join(","),
      requestType,
      sessionReady,
    ],
  );

  const popupRef = useRef<Window>();

  useWindowEvent(
    "message",
    (e) => {
      const popup = popupRef.current;
      if (isNonNullish(popup) && e.source === popup) {
        if (e.data.name === "session_completed") {
          setSessionReady(true);
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
      setSessionReady(false);
      setRequestType(filteredReplies.length ? "RETRY" : "START");
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
        if (!isApolloError(e, "MISSING_ID_VERIFICATION_INTEGRATION")) {
          onError(e);
        }
        setState("ERROR");
      }
    }
  };

  const handleCancelClick = () => {
    setState("IDLE");
    popupRef.current?.close();
  };

  const showStartAgainDialog = useRecipientViewIdVerificationStartAgainDialog();
  const hasError = filteredReplies.some(
    (r) => isNonNullish(r.content.error) && r.content.error.length > 0,
  );

  const handleStartAgain = async () => {
    try {
      if (!hasError) {
        await showStartAgainDialog({ tone });
      }
      await handleStart();
    } catch {}
  };

  const allRepliesApproved = filteredReplies.every((r) => r.status === "APPROVED");

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment}
    >
      <Box marginTop={2}>
        {state === "FETCHING" ? (
          <Stack spacing={0} flex="1">
            <Text fontSize="sm">
              <FormattedMessage
                id="component.recipient-view-petition-field-id-verification.verifying-documentation"
                defaultMessage="Verifying your documents..."
                values={{
                  tone,
                }}
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
        ) : (
          <>
            {filteredReplies.length === 0 ? (
              <Button
                variant="outline"
                onClick={handleStart}
                isDisabled={isDisabled || hasIdVerificationFeature === false}
                outlineColor={isInvalid ? "red.500" : undefined}
                id={`reply-${field.id}${parentReplyId ? `-${parentReplyId}` : ""}-new`}
              >
                <FormattedMessage id="generic.start" defaultMessage="Start" />
              </Button>
            ) : (
              <Stack spacing={2}>
                {filteredReplies.map((reply) => (
                  <RecipientViewIdVerificationReplyContent
                    key={reply.id}
                    fieldId={field.id}
                    reply={reply}
                  />
                ))}
              </Stack>
            )}

            {state === "ERROR" ? (
              <HStack alignItems="center" marginTop={2} color="red.600">
                <ExclamationOutlineIcon boxSize={4} />
                <Text fontSize="sm">
                  <FormattedMessage
                    id="component.recipient-view-petition-field-id-verification.error"
                    defaultMessage="We were unable to verify your documents. Please try again."
                    values={{
                      tone,
                    }}
                  />
                </Text>
              </HStack>
            ) : null}
            {filteredReplies.length > 0 ? (
              <Flex marginTop={2} justify="flex-end">
                <Button
                  variant="link"
                  onClick={handleStartAgain}
                  isDisabled={
                    allRepliesApproved || isDisabled || hasIdVerificationFeature === false
                  }
                >
                  <FormattedMessage
                    id="component.recipient-view-petition-field-id-verification.start-again"
                    defaultMessage="Start again"
                  />
                </Button>
              </Flex>
            ) : null}
          </>
        )}
      </Box>
      {hasIdVerificationFeature === false ? (
        <RestrictedPetitionFieldAlert marginTop={2} fieldType="ID_VERIFICATION" />
      ) : null}
    </RecipientViewPetitionFieldLayout>
  );
}

export function RecipientViewIdVerificationReplyContent({
  fieldId,
  reply,
}: {
  fieldId: string;
  reply: UnwrapArray<RecipientViewPetitionFieldLayout_PetitionFieldSelection["replies"]>;
}) {
  const tone = useTone();
  const intl = useIntl();

  const contentType = reply.content?.contentType ?? "";
  const isVideo = contentType.includes("video");
  const hasError = isNonNullish(reply.content.error) && reply.content.error.length > 0;
  return (
    <HStack
      key={reply.id}
      width="100%"
      alignItems="top"
      id={`reply-${fieldId}${reply.parent ? `-${reply.parent.id}` : ""}-${reply.id}`}
    >
      <Center borderRadius="md" border="1px solid" borderColor="gray.200" width={10} height={10}>
        {hasError ? <AlertCircleIcon color="red.600" /> : <CloudOkIcon color="green.600" />}
      </Center>
      {hasError ? (
        <Stack spacing={0} flex="1">
          <Text fontSize="sm">
            <FormattedMessage
              id="component.recipient-view-petition-field-id-verification.verification-not-completed"
              defaultMessage="Identity verification not completed"
            />
          </Text>
          <Text color="red.600" fontSize="sm">
            <FormattedMessage
              id="component.recipient-view-petition-field-id-verification.verification-canceled"
              defaultMessage="The verification was cancelled before completion. Please try again."
              values={{
                tone,
              }}
            />
          </Text>
        </Stack>
      ) : (
        <>
          <Stack spacing={0} flex="1">
            <Text fontSize="sm">
              {isVideo ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-id-verification.video-successfully-completed"
                  defaultMessage="Video identification completed successfully"
                />
              ) : (
                <FormattedMessage
                  id="component.recipient-view-petition-field-id-verification.id-document-successfully-completed"
                  defaultMessage="Identity document verification completed successfully"
                />
              )}
            </Text>
            <DateTime fontSize="xs" value={reply.createdAt} format={FORMATS.LLL} useRelativeTime />
          </Stack>
          <Center boxSize={10}>
            {reply.status === "APPROVED" ? (
              <Tooltip
                label={intl.formatMessage({
                  id: "component.recipient-view-petition-field-reply.approved-file",
                  defaultMessage: "This file has been approved",
                })}
              >
                <CheckIcon color="green.600" />
              </Tooltip>
            ) : reply.status === "REJECTED" ? (
              <Tooltip
                label={intl.formatMessage({
                  id: "component.recipient-view-petition-field-reply.rejected-file",
                  defaultMessage: "This file has been rejected",
                })}
              >
                <CloseIcon fontSize="14px" color="red.500" />
              </Tooltip>
            ) : null}
          </Center>
        </>
      )}
    </HStack>
  );
}
