import { gql } from "@apollo/client";
import { Box, Button, Center, Flex, HStack, List, Progress, Stack } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import {
  BusinessIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  DownloadIcon,
  QuestionIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { DowJonesRiskLabel } from "@parallel/components/petition-common/DowJonesRiskLabel";
import { usePreviewDowJonesPermissionDeniedDialog } from "@parallel/components/petition-preview/dialogs/PreviewDowJonesPermissionDeniedDialog";
import { PreviewPetitionFieldKyc_PetitionBaseFragment } from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { FORMATS } from "@parallel/utils/dates";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { useInterval } from "@parallel/utils/useInterval";
import { useWindowEvent } from "@parallel/utils/useWindowEvent";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
} from "../../recipient-view/fields/RecipientViewPetitionFieldLayout";
import { Text } from "@parallel/components/ui";

export interface PreviewPetitionFieldKycProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  petition: PreviewPetitionFieldKyc_PetitionBaseFragment;
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onDownloadReply: (replyId: string) => void;
  onRefreshField: () => void;
  isInvalid?: boolean;
  isCacheOnly?: boolean;
  parentReplyId?: string;
}

export function PreviewPetitionFieldKyc({
  field,
  petition,
  isDisabled,
  isInvalid,
  onDeleteReply,
  onDownloadReply,
  onDownloadAttachment,
  onCommentsButtonClick,
  onRefreshField,
  isCacheOnly,
  parentReplyId,
}: PreviewPetitionFieldKycProps) {
  const intl = useIntl();
  const [state, setState] = useState<"IDLE" | "FETCHING">("IDLE");
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const handleDeletePetitionReply = useCallback(
    async function handleDeletePetitionReply({ replyId }: { replyId: string }) {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
    },
    [onDeleteReply],
  );

  const browserTabRef = useRef<Window>();
  useInterval(
    async (done) => {
      if (isNonNullish(browserTabRef.current) && browserTabRef.current.closed) {
        setState("IDLE");
        done();
      } else if (state === "FETCHING") {
        onRefreshField();
      }
    },
    10000,
    [onRefreshField, state, field.replies.length],
  );

  useWindowEvent(
    "message",
    (e) => {
      const browserTab = browserTabRef.current;
      if (isNonNullish(browserTab) && e.source === browserTab && e.data === "refresh") {
        onRefreshField();
      }
    },
    [onRefreshField],
  );

  const showDowJonesRestrictedDialog = usePreviewDowJonesPermissionDeniedDialog();
  const handleStart = async () => {
    if (petition.organization.hasDowJones) {
      setState("FETCHING");
      try {
        browserTabRef.current = await openNewWindow(
          `/${intl.locale}/app/petitions/${petition.id}/preview/dowjones/${field.id}`,
        );
      } catch {}
      if (isCacheOnly) {
        setState("IDLE");
      }
    } else {
      await showDowJonesRestrictedDialog();
    }
  };

  const handleCancelClick = () => {
    setState("IDLE");
    browserTabRef.current?.close();
  };

  const fieldReplies = completedFieldReplies(field);

  const filteredCompletedFieldReplies = parentReplyId
    ? field.replies.filter(
        (r) => r.parent?.id === parentReplyId && fieldReplies.some((fr) => fr.id === r.id),
      )
    : fieldReplies;

  const filteredReplies = parentReplyId
    ? field.replies.filter((r) => r.parent?.id === parentReplyId)
    : field.replies;

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment}
    >
      {filteredCompletedFieldReplies.length ? (
        <Text fontSize="sm" color="gray.600">
          <FormattedMessage
            id="component.recipient-view-petition-field-card.profiles-uploaded"
            defaultMessage="{count, plural, =1 {1 profile uploaded} other {# profiles uploaded}}"
            values={{ count: filteredCompletedFieldReplies.length }}
          />
        </Text>
      ) : null}

      {filteredReplies.length ? (
        <List as={Stack} marginTop={1}>
          <AnimatePresence initial={false}>
            {filteredReplies.map((reply) => (
              <motion.li
                key={reply.id}
                layout
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0, transition: { ease: "easeOut" } }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <KYCResearchFieldReplyProfile
                  id={`reply-${field.id}-${reply.id}`}
                  reply={reply}
                  isDisabled={isDisabled || isDeletingReply[reply.id] || reply.isAnonymized}
                  onRemove={() => handleDeletePetitionReply({ replyId: reply.id })}
                  onDownload={onDownloadReply}
                  isDownloadDisabled={isCacheOnly || reply.isAnonymized}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      <Button
        variant="outline"
        onClick={handleStart}
        isDisabled={isDisabled || state === "FETCHING"}
        marginTop={3}
        outlineColor={state !== "FETCHING" && isInvalid ? "red.500" : undefined}
        id={`reply-${field.id}${parentReplyId ? `-${parentReplyId}` : ""}-new`}
      >
        {filteredReplies.length ? (
          <FormattedMessage
            id="component.preview-petition-field-kyc-research.do-another-search"
            defaultMessage="Do another search"
          />
        ) : (
          <FormattedMessage
            id="component.preview-petition-field-kyc-research.search-in-down-jones"
            defaultMessage="Search in Dow Jones"
          />
        )}
      </Button>
      {state === "FETCHING" ? (
        <Stack marginTop={4}>
          <Text fontSize="sm">
            <FormattedMessage
              id="component.preview-petition-field-kyc-research.wait-perform-search"
              defaultMessage="Please wait while we perform the search..."
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

interface KYCResearchFieldReplyProfileProps {
  id: string;
  reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled: boolean;
  onRemove?: () => void;
  onDownload?: (replyId: string) => void;
  isDownloadDisabled?: boolean;
}

export function KYCResearchFieldReplyProfile({
  id,
  reply,
  isDisabled,
  onRemove,
  onDownload,
  isDownloadDisabled,
}: KYCResearchFieldReplyProfileProps) {
  const intl = useIntl();
  const uploadHasFailed = reply.content.uploadComplete === false;

  return (
    <Stack direction="row" alignItems="center" backgroundColor="white" id={id}>
      <Center
        boxSize={10}
        borderRadius="md"
        border="1px solid"
        borderColor={uploadHasFailed ? "red.500" : "gray.300"}
        color="gray.600"
        boxShadow="sm"
        fontSize="xl"
      >
        {reply.isAnonymized ? (
          <QuestionIcon color="gray.300" />
        ) : reply.content.entity.type === "Entity" ? (
          <BusinessIcon />
        ) : (
          <UserIcon />
        )}
      </Center>
      <Box flex="1" overflow="hidden" paddingBottom="2px">
        <Flex minWidth={0} alignItems="baseline">
          {!reply.isAnonymized ? (
            <Flex flexWrap="wrap" gap={2}>
              <Text as="span" lineHeight={1.2}>
                {reply.content?.entity.name}
              </Text>
              <Flex flexWrap="wrap" gap={2} alignItems="center">
                {(reply.content.entity.iconHints as string[] | undefined)?.map((hint, i) => (
                  <DowJonesRiskLabel key={i} risk={hint} />
                ))}
              </Flex>
            </Flex>
          ) : (
            <Text textStyle="hint">
              <FormattedMessage
                id="generic.document-not-available"
                defaultMessage="Document not available"
              />
            </Text>
          )}
        </Flex>
        <Text fontSize="xs">
          {uploadHasFailed ? (
            <Text color="red.600">
              <FormattedMessage
                id="component.kyc-research-field-reply.profile-incomplete"
                defaultMessage="There was an error saving the profile. Please try again."
              />
            </Text>
          ) : (
            <DateTime value={reply.createdAt} format={FORMATS.LLL} useRelativeTime />
          )}
        </Text>
      </Box>
      {reply.status !== "PENDING" ? (
        <Center boxSize={10}>
          {reply.status === "APPROVED" ? (
            <Tooltip
              label={intl.formatMessage({
                id: "component.kyc-research-field-reply.approved-profile",
                defaultMessage: "This profile has been approved",
              })}
            >
              <CheckIcon color="green.600" />
            </Tooltip>
          ) : (
            <Tooltip
              label={intl.formatMessage({
                id: "component.kyc-research-field-reply.rejected-profile",
                defaultMessage: "This profile has been rejected",
              })}
            >
              <CloseIcon fontSize="14px" color="red.500" />
            </Tooltip>
          )}
        </Center>
      ) : null}
      {onDownload !== undefined ? (
        <IconButtonWithTooltip
          isDisabled={uploadHasFailed || isDownloadDisabled}
          onClick={() => onDownload(reply.id)}
          variant="ghost"
          icon={<DownloadIcon />}
          size="md"
          placement="bottom"
          label={intl.formatMessage({
            id: "component.kyc-research-field-reply.download-label",
            defaultMessage: "Download profile",
          })}
        />
      ) : null}
      {onRemove !== undefined ? (
        <IconButtonWithTooltip
          isDisabled={isDisabled || reply.status === "APPROVED"}
          onClick={onRemove}
          variant="ghost"
          icon={<DeleteIcon />}
          size="md"
          placement="bottom"
          label={intl.formatMessage({
            id: "component.kyc-research-field-reply.remove-reply-label",
            defaultMessage: "Remove reply",
          })}
        />
      ) : null}
    </Stack>
  );
}

const _fragments = {
  PetitionBase: gql`
    fragment PreviewPetitionFieldKyc_PetitionBase on PetitionBase {
      id
      organization {
        id
        hasDowJones: hasIntegration(integration: DOW_JONES_KYC)
      }
    }
  `,
};
