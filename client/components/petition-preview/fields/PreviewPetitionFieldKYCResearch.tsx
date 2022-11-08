import { gql } from "@apollo/client";
import { useTone } from "@parallel/components/common/ToneProvider";
import { usePreviewDowJonesPermissionDeniedDialog } from "@parallel/components/petition-preview/dialogs/PreviewDowJonesPermissionDeniedDialog";
import { FormattedMessage } from "react-intl";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
  RecipientViewPetitionFieldCard_PetitionFieldReplySelection,
} from "../../recipient-view/fields/RecipientViewPetitionFieldCard";

import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  List,
  Progress,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  BusinessIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  DownloadIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { DowJonesHints } from "@parallel/components/petition-common/DowJonesHints";
import { FORMATS } from "@parallel/utils/dates";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { useInterval } from "@parallel/utils/useInterval";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";

export interface PreviewPetitionFieldKYCResearchProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onDownloadReply: (replyId: string) => void;
  onRefreshField: () => void;
  isCacheOnly?: boolean;
}

export function PreviewPetitionFieldKYCResearch({
  field,
  isDisabled,
  isInvalid,
  onDeleteReply,
  onDownloadReply,
  onDownloadAttachment,
  onCommentsButtonClick,
  onRefreshField,
  isCacheOnly,
}: PreviewPetitionFieldKYCResearchProps) {
  const tone = useTone();
  const intl = useIntl();
  const [state, setState] = useState<"IDLE" | "FETCHING">("IDLE");
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const handleDeletePetitionReply = useCallback(
    async function handleDeletePetitionReply({ replyId }: { replyId: string }) {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
    },
    [onDeleteReply]
  );

  const popupRef = useRef<Window>();
  useInterval(
    async (done) => {
      if (isDefined(popupRef.current) && popupRef.current.closed) {
        setState("IDLE");
        done();
      } else if (state === "FETCHING") {
        onRefreshField();
      }
    },
    5000,
    [onRefreshField, state, field.replies.length]
  );

  useEffect(() => {
    const handler = function (e: MessageEvent) {
      const popup = popupRef.current;
      if (isDefined(popup) && e.source === popup && e.data.name === "success") {
        onRefreshField();
        popup.close();
        setState("IDLE");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onRefreshField]);

  const showDowJonesRestrictedDialog = usePreviewDowJonesPermissionDeniedDialog();
  const handleStart = async () => {
    if (field.petition.organization.hasDowJones) {
      setState("FETCHING");
      popupRef.current = await openNewWindow(
        `/${intl.locale}/app/petitions/${field.petition.id}/preview/dowjones/${field.id}`
      );
      if (isCacheOnly) {
        setState("IDLE");
      }
    } else {
      await showDowJonesRestrictedDialog();
    }
  };

  const handleCancelClick = () => {
    setState("IDLE");
    popupRef.current?.close();
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
        <List as={Stack} marginTop={1}>
          <AnimatePresence initial={false}>
            {field.replies.map((reply) => (
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
      >
        {field.replies.length ? (
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
    </RecipientViewPetitionFieldCard>
  );
}

interface KYCResearchFieldReplyProfileProps {
  id: string;
  reply: RecipientViewPetitionFieldCard_PetitionFieldReplySelection;
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
        {reply.content.entity.type === "Entity" ? <BusinessIcon /> : <UserIcon />}
      </Center>
      <Box flex="1" overflow="hidden" paddingBottom="2px">
        <Flex minWidth={0} whiteSpace="nowrap" alignItems="baseline">
          {!reply.isAnonymized ? (
            <>
              <HStack flexWrap="wrap" spacing={0} gridGap={2}>
                <Text as="span">{reply.content?.entity.name}</Text>
                <DowJonesHints hints={reply.content.entity.iconHints ?? []} />
              </HStack>
            </>
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

PreviewPetitionFieldKYCResearch.fragments = {
  PetitionField: gql`
    fragment PreviewPetitionFieldKYCResearch_PetitionField on PetitionField {
      id
      ...RecipientViewPetitionFieldCard_PetitionField
      petition {
        id
        organization {
          id
          hasDowJones: hasIntegration(integration: DOW_JONES_KYC)
        }
      }
    }
    ${RecipientViewPetitionFieldCard.fragments.PetitionField}
  `,
};
