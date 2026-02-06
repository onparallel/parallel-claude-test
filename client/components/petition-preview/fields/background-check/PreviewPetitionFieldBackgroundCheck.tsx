import { gql } from "@apollo/client";
import { Box, Center, Flex, HStack, List, Progress, Stack } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import {
  BusinessIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  EyeIcon,
  QuestionIcon,
  ShortSearchIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import { FalsePositivesBadge } from "@parallel/components/common/BackgroundCheckBadges";
import { DateTime } from "@parallel/components/common/DateTime";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { BackgroundCheckRiskLabel } from "@parallel/components/petition-common/BackgroundCheckRiskLabel";
import { RestrictedPetitionFieldAlert } from "@parallel/components/petition-common/alerts/RestrictedPetitionFieldAlert";
import { Button, Text } from "@parallel/components/ui";
import {
  PreviewPetitionFieldBackgroundCheck_PetitionBaseFragment,
  PreviewPetitionFieldBackgroundCheck_UserFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { FORMATS } from "@parallel/utils/dates";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { getEntityTypeLabel } from "@parallel/utils/getEntityTypeLabel";
import { useManagedWindow } from "@parallel/utils/hooks/useManagedWindow";
import { useLoadCountryNames } from "@parallel/utils/useLoadCountryNames";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, zip } from "remeda";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
} from "../../../recipient-view/fields/RecipientViewPetitionFieldLayout";

export interface PreviewPetitionFieldBackgroundCheckProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  user: PreviewPetitionFieldBackgroundCheck_UserFragment;
  petition: PreviewPetitionFieldBackgroundCheck_PetitionBaseFragment;
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => Promise<void>;
  onRefreshField: () => void;
  isInvalid?: boolean;
  isCacheOnly?: boolean;
  parentReplyId?: string;
}

export function PreviewPetitionFieldBackgroundCheck({
  user,
  field,
  petition,
  isDisabled,
  isInvalid,
  onDeleteReply,
  onDownloadAttachment,
  onCommentsButtonClick,
  onRefreshField,
  isCacheOnly,
  parentReplyId,
}: PreviewPetitionFieldBackgroundCheckProps) {
  const intl = useIntl();

  const { state, setState, openWindow, closeWindow } = useManagedWindow({
    onRefreshField,
  });

  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});

  const fieldLogic = useFieldLogic(petition, isCacheOnly);

  const visibleFields = zip(petition.fields, fieldLogic)
    .filter(([_, { isVisible }]) => isVisible)
    .map(([field, { groupChildrenLogic }]) => {
      if (field.type === "FIELD_GROUP") {
        return {
          ...field,
          replies: field.replies.map((r, groupIndex) => ({
            ...r,
            children: r.children?.filter(
              (_, childReplyIndex) =>
                groupChildrenLogic?.[groupIndex][childReplyIndex].isVisible ?? false,
            ),
          })),
        };
      } else {
        return field;
      }
    });

  const tokenBase64 = btoa(
    JSON.stringify({
      fieldId: field.id,
      petitionId: petition.id,
      ...(!isCacheOnly && parentReplyId ? { parentReplyId } : {}),
    }),
  );

  const handleDeletePetitionReply = useCallback(
    async function handleDeletePetitionReply({ replyId }: { replyId: string }) {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);

      closeWindow();
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
    },
    [onDeleteReply],
  );

  const handleViewReply = useCallback(
    async (reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection) => {
      let url = `/${intl.locale}/app/background-check`;

      const isReadOnly = reply.status === "APPROVED" || isDisabled;

      const { name, date, type, country, birthCountry } = reply.content?.query ?? {};
      const urlParams = new URLSearchParams({
        token: tokenBase64,
        ...(name ? { name } : {}),
        ...(date ? { date } : {}),
        ...(type ? { type } : {}),
        ...(country ? { country } : {}),
        ...(birthCountry ? { birthCountry } : {}),
        ...(isReadOnly ? { readonly: "true" } : {}),
      });

      if (reply.content.entity) {
        // Go to details
        url += `/${reply.content.entity.id}?${urlParams}`;
      } else if (reply.content.query) {
        // Go to results because is a search
        url += `/results?${urlParams}`;
      }

      await openWindow(url);
    },
    [intl.locale, isDisabled],
  );

  const handleStart = async () => {
    setState("FETCHING");

    let url = `/${intl.locale}/app/background-check`;

    const options = field.options as FieldOptions["BACKGROUND_CHECK"];

    const searchParams = new URLSearchParams({
      token: tokenBase64,
      ...(isCacheOnly ? { template: "true" } : {}),
    });

    if (field.replies.length) {
      const reply = field.replies[0];
      const { name, date, type, country, birthCountry } = reply.content?.query ?? {};

      if (name) {
        searchParams.set("name", name);
      }
      if (date) {
        searchParams.set("date", date);
      }
      if (type) {
        searchParams.set("type", type);
      }
      if (country) {
        searchParams.set("country", country);
      }
      if (birthCountry) {
        searchParams.set("birthCountry", birthCountry);
      }
    } else if (isNonNullish(options.autoSearchConfig)) {
      const fields = parentReplyId
        ? visibleFields.flatMap((f) => [f, ...(f.children ?? [])])
        : visibleFields;

      const name = options
        .autoSearchConfig!.name.map((id) => {
          const field = fields.find((f) => f.id === id);
          if (field) {
            const replies = isCacheOnly ? field.previewReplies : field.replies;
            return field.parent && parentReplyId
              ? replies.find((r) => r?.parent?.id === parentReplyId)?.content.value
              : replies[0]?.content.value;
          }
          return null;
        })
        .filter(isNonNullish)
        .join(" ")
        .trim();

      const date =
        fields.find((f) => f.id === options.autoSearchConfig!.date)?.replies[0]?.content.value ??
        "";

      if (name || date) {
        const country =
          fields.find((f) => f.id === options.autoSearchConfig!.country)?.replies[0]?.content
            .value ?? "";

        const birthCountry =
          fields.find((f) => f.id === options.autoSearchConfig!.birthCountry)?.replies[0]?.content
            .value ?? "";

        if (name) {
          searchParams.set("name", name);
        }
        if (date) {
          searchParams.set("date", date);
        }
        if (options.autoSearchConfig.type) {
          searchParams.set("type", options.autoSearchConfig.type);
        }
        if (country) {
          searchParams.set("country", country);
        }

        if (birthCountry) {
          searchParams.set("birthCountry", birthCountry);
        }

        url += `/results`;
      }
    }

    await openWindow(`${url}?${searchParams.toString()}`);

    if (isCacheOnly) {
      setState("IDLE");
    }
  };

  const handleCancelClick = () => {
    closeWindow();
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

  const showRestrictedPetitionFieldAlert = !user?.hasBackgroundCheck;

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
                  onViewReply={handleViewReply}
                  isViewDisabled={
                    isCacheOnly || reply.isAnonymized || !!petition.permanentDeletionAt
                  }
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      <Button
        variant="outline"
        onClick={handleStart}
        disabled={
          isDisabled ||
          state === "FETCHING" ||
          showRestrictedPetitionFieldAlert ||
          filteredReplies.some((reply) => reply.status === "APPROVED")
        }
        marginTop={3}
        outlineColor={state !== "FETCHING" && isInvalid ? "red.500" : undefined}
        id={`reply-${field.id}${parentReplyId ? `-${parentReplyId}` : ""}-new`}
      >
        {filteredReplies.length ? (
          <FormattedMessage
            id="component.preview-petition-background-check.do-another-search"
            defaultMessage="Modify search"
          />
        ) : (
          <FormattedMessage
            id="component.preview-petition-background-check.check-lists"
            defaultMessage="Run background check"
          />
        )}
      </Button>
      {state === "FETCHING" ? (
        <Stack marginTop={4}>
          <Text fontSize="sm">
            <FormattedMessage
              id="component.preview-petition-background-check.wait-perform-search"
              defaultMessage="Please wait while we run the background check..."
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
      {showRestrictedPetitionFieldAlert ? (
        <RestrictedPetitionFieldAlert fieldType="BACKGROUND_CHECK" marginTop={3} />
      ) : null}
    </RecipientViewPetitionFieldLayout>
  );
}

interface KYCResearchFieldReplyProfileProps {
  id: string;
  reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled: boolean;
  onRemove?: () => void;
  onViewReply?: (reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection) => void;
  isViewDisabled?: boolean;
}

export function KYCResearchFieldReplyProfile({
  id,
  reply,
  isDisabled,
  onRemove,
  onViewReply,
  isViewDisabled,
}: KYCResearchFieldReplyProfileProps) {
  const intl = useIntl();
  const entityTypeLabel = getEntityTypeLabel(intl, reply.content?.query?.type);
  const countryNames = useLoadCountryNames(intl.locale);

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
        {reply.isAnonymized ? (
          <QuestionIcon color="gray.300" />
        ) : reply.content?.entity?.type === "Company" ? (
          <BusinessIcon />
        ) : reply.content?.entity?.type === "Person" ? (
          <UserIcon />
        ) : (
          <ShortSearchIcon />
        )}
      </Center>
      <Box flex="1" overflow="hidden" paddingBottom="2px">
        <Flex minWidth={0} alignItems="baseline">
          {!reply.isAnonymized ? (
            reply.content?.entity ? (
              <Flex flexWrap="wrap" gap={2}>
                <Text as="span" lineHeight={1.2}>
                  {reply.content?.entity?.name}
                </Text>
                <Flex flexWrap="wrap" gap={2} alignItems="center">
                  {(reply.content?.entity?.properties?.topics as string[] | undefined)?.map(
                    (hint, i) => <BackgroundCheckRiskLabel key={i} risk={hint} />,
                  )}
                </Flex>
              </Flex>
            ) : (
              <Flex flexWrap="wrap" gap={2} alignItems="center">
                <Text as="span">
                  {[
                    entityTypeLabel,
                    reply.content?.query?.name,
                    reply.content?.query?.date,
                    reply.content?.query?.country && countryNames.countries
                      ? countryNames.countries[reply.content?.query?.country]
                      : reply.content?.query?.country,
                    reply.content?.query?.birthCountry && countryNames.countries
                      ? countryNames.countries[reply.content?.query?.birthCountry]
                      : reply.content?.query?.birthCountry,
                  ]
                    .filter(isNonNullish)
                    .join(" | ")}
                </Text>
                <Text as="span" color="gray.500" fontSize="sm">
                  {`(${intl.formatMessage(
                    {
                      id: "generic.n-results",
                      defaultMessage:
                        "{count, plural,=0{No results} =1 {1 result} other {# results}}",
                    },
                    {
                      count: reply.content?.search?.totalCount ?? 0,
                    },
                  )})`}
                </Text>
                {reply.content?.search &&
                reply.content?.search?.totalCount > 0 &&
                reply.content?.search?.falsePositivesCount === reply.content?.search?.totalCount ? (
                  <FalsePositivesBadge />
                ) : null}
              </Flex>
            )
          ) : (
            <Text textStyle="hint">
              <FormattedMessage
                id="generic.reply-not-available"
                defaultMessage="Reply not available"
              />
            </Text>
          )}
        </Flex>
        <Text fontSize="xs">
          <DateTime value={reply.createdAt} format={FORMATS.LLL} useRelativeTime />
        </Text>
      </Box>
      {reply.status !== "PENDING" ? (
        <Center boxSize={10}>
          {reply.status === "APPROVED" ? (
            <Tooltip
              label={intl.formatMessage({
                id: "component.preview-petition-field-background-check.approved-profile",
                defaultMessage: "This profile has been approved",
              })}
            >
              <CheckIcon color="green.600" />
            </Tooltip>
          ) : (
            <Tooltip
              label={intl.formatMessage({
                id: "component.preview-petition-field-background-check.rejected-profile",
                defaultMessage: "This profile has been rejected",
              })}
            >
              <CloseIcon fontSize="14px" color="red.500" />
            </Tooltip>
          )}
        </Center>
      ) : null}

      <IconButtonWithTooltip
        disabled={isViewDisabled}
        onClick={() => {
          onViewReply?.(reply);
        }}
        variant="ghost"
        icon={<EyeIcon />}
        size="md"
        placement="bottom"
        label={
          isNonNullish(reply.content?.entity)
            ? intl.formatMessage({
                id: "component.preview-petition-field-background-check.view-details",
                defaultMessage: "View details",
              })
            : intl.formatMessage({
                id: "component.preview-petition-field-background-check.view-results",
                defaultMessage: "View results",
              })
        }
      />

      {onRemove !== undefined ? (
        <IconButtonWithTooltip
          disabled={isDisabled || reply.status === "APPROVED"}
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
    fragment PreviewPetitionFieldBackgroundCheck_User on User {
      id
      hasBackgroundCheck: hasFeatureFlag(featureFlag: BACKGROUND_CHECK)
    }
  `,
  PetitionField: gql`
    fragment PreviewPetitionFieldBackgroundCheck_PetitionField on PetitionField {
      id
      parent {
        id
      }
      previewReplies @client {
        id
        content
        parent {
          id
        }
      }
      replies {
        id
        content
        parent {
          id
        }
      }
    }
  `,
  PetitionBase: gql`
    fragment PreviewPetitionFieldBackgroundCheck_PetitionBase on PetitionBase {
      id
      fields {
        id
        ...PreviewPetitionFieldBackgroundCheck_PetitionField
        children {
          id
          ...PreviewPetitionFieldBackgroundCheck_PetitionField
        }
      }
      permanentDeletionAt
      ...useFieldLogic_PetitionBase
    }
  `,
};
