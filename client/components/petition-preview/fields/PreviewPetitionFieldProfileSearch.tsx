import { gql } from "@apollo/client";
import { Badge, Box, Button, Center, HStack, List, Progress, Stack, Text } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import {
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  ProfileSearchIcon,
  QuestionIcon,
} from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
  RecipientViewPetitionFieldLayoutProps,
} from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldLayout";
import {
  PreviewPetitionFieldProfileSearch_PetitionBaseFragment,
  PreviewPetitionFieldProfileSearch_UserFragment,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { useInterval } from "@parallel/utils/useInterval";
import { useWindowEvent } from "@parallel/utils/useWindowEvent";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";

export interface PreviewPetitionFieldProfileSearchProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  user: PreviewPetitionFieldProfileSearch_UserFragment;
  petition: PreviewPetitionFieldProfileSearch_PetitionBaseFragment;
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => Promise<void>;
  onRefreshField: () => void;
  isInvalid?: boolean;
  isCacheOnly?: boolean;
  parentReplyId?: string;
}

export function PreviewPetitionFieldProfileSearch({
  field,
  petition,
  user,
  isDisabled,
  isInvalid,
  onDeleteReply,
  onDownloadAttachment,
  onCommentsButtonClick,
  onRefreshField,
  isCacheOnly,
  parentReplyId,
}: PreviewPetitionFieldProfileSearchProps) {
  const intl = useIntl();
  const router = useRouter();
  const browserTabRef = useRef<Window | null>(null);
  const [state, setState] = useState<"IDLE" | "FETCHING">("IDLE");

  const handleStart = async () => {
    setState("FETCHING");

    const urlParams = new URLSearchParams({
      fieldId: field.id,
      petitionId: petition.id,
      ...(parentReplyId ? { parentReplyId } : {}),
    });
    const url = `/${intl.locale}/app/profile-check?${urlParams}`;

    try {
      browserTabRef.current = await openNewWindow(url);
    } catch {}

    if (isCacheOnly) {
      setState("IDLE");
    }
  };

  useInterval(
    async (done) => {
      if (isNonNullish(browserTabRef.current) && browserTabRef.current.closed) {
        setState("IDLE");
        done();
      } else if (state === "FETCHING") {
        onRefreshField();
      }
    },
    5000,
    [onRefreshField, state, field.replies.length],
  );

  useEffect(() => {
    const handleRouteChange = () => {
      if (isNonNullish(browserTabRef.current)) {
        browserTabRef.current.close();
      }
    };

    router.events.on("routeChangeStart", handleRouteChange);

    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, []);

  useWindowEvent(
    "message",
    async (e) => {
      const browserTab = browserTabRef.current;
      if (isNullish(browserTab) || e.source !== browserTab) {
        return;
      }
      if (e.data === "refresh") {
        onRefreshField();
      }
    },
    [onRefreshField],
  );

  const handleCancelClick = () => {
    setState("IDLE");
    browserTabRef.current?.close();
  };

  const filteredReplies = parentReplyId
    ? field.replies.filter((r) => r.parent?.id === parentReplyId)
    : field.replies;

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment}
    >
      {filteredReplies.length ? (
        <Text fontSize="sm" color="gray.600">
          <FormattedMessage
            id="component.recipient-view-petition-field-card.searches-uploaded"
            defaultMessage="{count, plural, =1 {1 search uploaded} other {# searches uploaded}}"
            values={{ count: field.replies.length }}
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
                <PreviewPetitionFieldProfileSearchReply
                  id={`reply-${field.id}-${reply.id}`}
                  reply={reply}
                  isDisabled={isDisabled || reply.isAnonymized}
                  onRemove={() => onDeleteReply(reply.id)}
                  isViewDisabled={isCacheOnly || reply.isAnonymized}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      <Button
        variant="outline"
        onClick={handleStart}
        isDisabled={isDisabled || !user.hasProfileSearchField}
        marginTop={3}
        id={`reply-${field.id}${parentReplyId ? `-${parentReplyId}` : ""}-new`}
      >
        {filteredReplies.length ? (
          <FormattedMessage
            id="component.preview-petition-field-profile-search.modify-search"
            defaultMessage="Modify search"
          />
        ) : (
          <FormattedMessage
            id="component.preview-petition-field-profile-search.run-profile-search"
            defaultMessage="Run profile search"
          />
        )}
      </Button>

      {state === "FETCHING" ? (
        <Stack marginTop={4}>
          <Text fontSize="sm">
            <FormattedMessage
              id="component.preview-petition-field-profile-search.wait-perform-search"
              defaultMessage="Running profile search..."
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

interface PreviewPetitionFieldProfileSearchReplyProps {
  id: string;
  reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled: boolean;
  onRemove?: () => void;
  onViewReply?: (reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection) => void;
  isViewDisabled?: boolean;
}

export function PreviewPetitionFieldProfileSearchReply({
  id,
  reply,
  isDisabled,
  onRemove,
  onViewReply,
  isViewDisabled,
}: PreviewPetitionFieldProfileSearchReplyProps) {
  const intl = useIntl();

  return (
    <Stack direction="row" alignItems="center" backgroundColor="white" id={id}>
      <Center
        boxSize={10}
        borderRadius="md"
        border="1px solid"
        borderColor="gray.300"
        color="gray.600"
        boxShadow="sm"
        fontSize="xl"
      >
        {reply.isAnonymized ? <QuestionIcon color="gray.300" /> : <ProfileSearchIcon boxSize={6} />}
      </Center>
      <Stack flex="1" spacing={0.5}>
        <Text>
          {reply.content.search}
          <Text as="span" marginStart={1} color="gray.500" fontSize="sm">
            (
            <FormattedMessage
              id="generic.x-results"
              defaultMessage="{count, plural, =0 {No results} =1 {1 result} other {# results}}"
              values={{ count: reply.content.totalResults }}
            />
            )
          </Text>
        </Text>
        {reply.content?.value.length === 0 ? (
          <Box>
            <Badge colorScheme="green" variant="outline">
              {reply.content?.totalResults > 0 ? (
                <FormattedMessage
                  id="component.petition-replies-field-reply.profile-search-no-relevant-results"
                  defaultMessage="No relevant results"
                />
              ) : (
                <FormattedMessage
                  id="component.petition-replies-field-reply.profile-search-no-results"
                  defaultMessage="No results"
                />
              )}
            </Badge>
          </Box>
        ) : (
          <FormattedList
            value={
              reply.content?.value.filter(isNonNullish).map((profile: any, index: number) => {
                return (
                  <LocalizableUserTextRender
                    key={profile.id}
                    value={profile.name}
                    default={
                      <Text textStyle="hint" as="span">
                        <FormattedMessage
                          id="generic.unnamed-profile"
                          defaultMessage="Unnamed profile"
                        />
                      </Text>
                    }
                  />
                );
              }) ?? []
            }
          />
        )}
      </Stack>
      {reply.status !== "PENDING" ? (
        <Center boxSize={10}>
          {reply.status === "APPROVED" ? (
            <Tooltip
              label={intl.formatMessage({
                id: "component.preview-petition-field-profile-search.approved-profile",
                defaultMessage: "This profile has been approved",
              })}
            >
              <CheckIcon color="green.600" />
            </Tooltip>
          ) : (
            <Tooltip
              label={intl.formatMessage({
                id: "component.preview-petition-field-profile-search.rejected-profile",
                defaultMessage: "This profile has been rejected",
              })}
            >
              <CloseIcon fontSize="14px" color="red.500" />
            </Tooltip>
          )}
        </Center>
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
            id: "component.preview-petition-field-background-check.remove-reply-label",
            defaultMessage: "Remove reply",
          })}
        />
      ) : null}
    </Stack>
  );
}

const _fragments = {
  User: gql`
    fragment PreviewPetitionFieldProfileSearch_User on User {
      id
      hasProfileSearchField: hasFeatureFlag(featureFlag: PROFILE_SEARCH_FIELD)
    }
  `,
  PetitionBase: gql`
    fragment PreviewPetitionFieldProfileSearch_PetitionBase on PetitionBase {
      id
    }
  `,
};
