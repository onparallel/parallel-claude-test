import { gql } from "@apollo/client";
import { Box, Button, Center, Flex, HStack, List, Progress, Stack, Text } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import {
  BookOpenIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  EyeIcon,
  QuestionIcon,
  ShortSearchIcon,
} from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { RestrictedPetitionFieldAlert } from "@parallel/components/petition-common/alerts/RestrictedPetitionFieldAlert";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
  RecipientViewPetitionFieldLayoutProps,
} from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldLayout";
import {
  AdverseMediaArticle,
  AdverseMediaSearchTermInput,
  PreviewPetitionFieldAdverseMediaSearch_PetitionBaseFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { useManagedWindow } from "@parallel/utils/hooks/useManagedWindow";
import { useHasAdverseMediaSearch } from "@parallel/utils/useHasAdverseMediaSearch";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, zip } from "remeda";
import { useConfirmDeleteAdverseMediaSearchDialog } from "../../dialogs/ConfirmDeleteAdverseMediaSearchDialog";

export interface PreviewPetitionFieldAdverseMediaSearchProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  petition: PreviewPetitionFieldAdverseMediaSearch_PetitionBaseFragment;
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => Promise<void>;
  onRefreshField: () => void;
  isInvalid?: boolean;
  isCacheOnly?: boolean;
  parentReplyId?: string;
}

export function PreviewPetitionFieldAdverseMediaSearch({
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
}: PreviewPetitionFieldAdverseMediaSearchProps) {
  const intl = useIntl();
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const { state, setState, openWindow, closeWindow } = useManagedWindow({
    onRefreshField,
  });

  const fieldLogic = useFieldLogic(petition, isCacheOnly);

  const { name, entity } = useMemo(() => {
    let name: string | undefined = undefined;
    let encodedEntity: string | undefined = undefined;
    const options = field.options as FieldOptions["ADVERSE_MEDIA_SEARCH"];
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

    if (isNonNullish(options.autoSearchConfig)) {
      const fields = parentReplyId
        ? visibleFields.flatMap((f) => [f, ...(f.children ?? [])])
        : visibleFields;

      name = options
        .autoSearchConfig!.name?.map((id) => {
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

      const entity = fields.find((f) => f.id === options.autoSearchConfig!.backgroundCheck)
        ?.replies[0]?.content.entity;

      if (entity) {
        encodedEntity = btoa(
          JSON.stringify({
            id: entity.id,
            name: entity.name,
          }),
        );
      }
    }

    return { name, entity: encodedEntity };
  }, [field, isCacheOnly, parentReplyId]);

  const hasAdverseMediaSearchFeatureFlag = useHasAdverseMediaSearch();

  const tokenBase64 = btoa(
    JSON.stringify({
      fieldId: field.id,
      petitionId: petition.id,
      ...(!isCacheOnly && parentReplyId ? { parentReplyId } : {}),
    }),
  );

  const handleStart = async () => {
    const searchParams = new URLSearchParams({
      token: tokenBase64,
      ...(field.replies.length > 0 ? { hasReply: "true" } : {}),
      ...(isCacheOnly ? { template: "true" } : {}),
      ...(name ? { name } : {}),
      ...(entity ? { entity } : {}),
    });

    const url = `/${intl.locale}/app/adverse-media?${searchParams.toString()}`;

    await openWindow(url);

    if (isCacheOnly) {
      setState("IDLE");
    }
  };

  const handleCancelClick = () => {
    closeWindow();
  };

  const reply = field.replies[0];

  const articlesSaved =
    reply?.content?.articles?.items.filter(
      (article: AdverseMediaArticle) => article.classification === "RELEVANT",
    ) ?? [];

  const hasReplies = field.replies.length > 0;

  const handleViewReply = useCallback(async () => {
    const url = `/${intl.locale}/app/adverse-media`;

    const isReadOnly = reply.status === "APPROVED" || isDisabled;

    const urlParams = new URLSearchParams({
      token: tokenBase64,
      hasReply: "true",
      ...(isReadOnly ? { readonly: "true" } : {}),
      ...(name ? { name } : {}),
      ...(entity ? { entity } : {}),
    });

    await openWindow(`${url}?${urlParams}`);
  }, [intl.locale, tokenBase64]);

  const handleViewArticle = useCallback(
    async (articleId: string) => {
      const url = `/${intl.locale}/app/adverse-media`;

      const isReadOnly = reply.status === "APPROVED" || isDisabled;

      const urlParams = new URLSearchParams({
        token: tokenBase64,
        articleId,
        hasReply: "true",
        defaultTabIndex: "1",
        ...(isReadOnly ? { readonly: "true" } : {}),
        ...(name ? { name } : {}),
        ...(entity ? { entity } : {}),
      });

      await openWindow(`${url}?${urlParams}`);
    },
    [intl.locale, tokenBase64],
  );

  const showConfirmDeleteAdverseMediaSearchDialog = useConfirmDeleteAdverseMediaSearchDialog();

  const handleDeleteReply = useCallback(
    async function handleDeletePetitionReply(replyId: string) {
      try {
        await showConfirmDeleteAdverseMediaSearchDialog();
        setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
        await onDeleteReply(replyId);

        closeWindow();
        setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
      } catch (e) {
        if (!isDialogError(e)) {
          throw e;
        }
      }
    },
    [onDeleteReply],
  );

  const filteredReplies = parentReplyId
    ? field.replies.filter((r) => r.parent?.id === parentReplyId)
    : field.replies;

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment}
    >
      {hasReplies ? (
        <Text fontSize="sm" color="gray.600">
          <FormattedMessage
            id="component.preview-petition-adverse-media-search.articles-saved"
            defaultMessage="{count, plural, =0 {Search criteria saved} other {Search criteria and {count} {count, plural, =1 {article} other {articles}} saved}}"
            values={{ count: articlesSaved.length }}
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
                <AdverseMediaSearchReply
                  id={reply.id}
                  reply={reply}
                  isDisabled={isDisabled || isDeletingReply[reply.id] || reply.isAnonymized}
                  onRemove={() => handleDeleteReply(reply.id)}
                  onViewReply={handleViewReply}
                  isViewDisabled={
                    isCacheOnly || reply.isAnonymized || !!petition.permanentDeletionAt
                  }
                />
              </motion.li>
            ))}
            {articlesSaved.map((article: AdverseMediaArticle) => (
              <motion.li
                key={article.id}
                layout
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0, transition: { ease: "easeOut" } }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <AdverseMediaSearchArticle
                  id={article.id}
                  article={article}
                  isDisabled={isDisabled}
                  onViewArticle={() => handleViewArticle(article.id)}
                  isViewDisabled={isCacheOnly || !!petition.permanentDeletionAt}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      <Button
        variant="outline"
        onClick={handleStart}
        isDisabled={
          isDisabled ||
          state === "FETCHING" ||
          !hasAdverseMediaSearchFeatureFlag ||
          filteredReplies.some((reply) => reply.status === "APPROVED")
        }
        marginTop={3}
        outlineColor={state !== "FETCHING" && isInvalid ? "red.500" : undefined}
        id={`reply-${field.id}${parentReplyId ? `-${parentReplyId}` : ""}-new`}
      >
        {filteredReplies.length ? (
          <FormattedMessage
            id="component.preview-petition-adverse-media-search.do-another-search"
            defaultMessage="Modify search"
          />
        ) : (
          <FormattedMessage
            id="component.preview-petition-adverse-media-search.run-adverse-media-search"
            defaultMessage="Search in media"
          />
        )}
      </Button>
      {state === "FETCHING" ? (
        <Stack marginTop={4}>
          <Text fontSize="sm">
            <FormattedMessage
              id="component.preview-petition-adverse-media-search.wait-perform-search"
              defaultMessage="Please wait while we run the adverse media search..."
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
      {!hasAdverseMediaSearchFeatureFlag ? (
        <RestrictedPetitionFieldAlert fieldType="ADVERSE_MEDIA_SEARCH" marginTop={3} />
      ) : null}
    </RecipientViewPetitionFieldLayout>
  );
}

interface AdverseMediaSearchReplyProps {
  id: string;
  reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled: boolean;
  onRemove?: () => void;
  onViewReply?: (reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection) => void;
  isViewDisabled?: boolean;
}

export function AdverseMediaSearchReply({
  id,
  reply,
  isDisabled,
  onRemove,
  onViewReply,
  isViewDisabled,
}: AdverseMediaSearchReplyProps) {
  const intl = useIntl();

  const dismissedArticles =
    reply?.content?.articles?.items.filter(
      (article: AdverseMediaArticle) => article.classification === "DISMISSED",
    ) ?? [];
  const nonRelevantArticles =
    reply?.content?.articles?.items.filter(
      (article: AdverseMediaArticle) => article.classification === "IRRELEVANT",
    ) ?? [];

  return (
    <HStack alignItems="center" backgroundColor="white" id={id}>
      <Center
        boxSize={10}
        borderRadius="md"
        border="1px solid"
        borderColor="gray.300"
        color="gray.600"
        boxShadow="sm"
        fontSize="xl"
      >
        {reply.isAnonymized ? <QuestionIcon color="gray.300" /> : <ShortSearchIcon />}
      </Center>
      <Box flex="1" overflow="hidden" paddingBottom="2px">
        <Flex minWidth={0} alignItems="baseline">
          {!reply.isAnonymized ? (
            <Flex flexWrap="wrap" gap={2} alignItems="center">
              <Text as="span">
                {intl.formatList(
                  reply.content?.search
                    ?.map((search: AdverseMediaSearchTermInput) => search.label || search.term)
                    .filter(isNonNullish),
                  { type: "disjunction" },
                )}
              </Text>
              <Text as="span" color="gray.500" fontSize="sm">
                {`(${intl.formatMessage(
                  {
                    id: "generic.n-results",
                    defaultMessage:
                      "{count, plural,=0{No results} =1 {1 result} other {# results}}",
                  },
                  {
                    count: reply.content?.articles?.totalCount ?? 0,
                  },
                )}, ${intl.formatMessage(
                  {
                    id: "generic.n-dismissed",
                    defaultMessage: "{count} dismissed",
                  },
                  {
                    count: dismissedArticles.length + nonRelevantArticles.length,
                  },
                )})`}
              </Text>
            </Flex>
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
                id: "component.preview-petition-field-adverse-media-search.approved",
                defaultMessage: "This search has been approved",
              })}
            >
              <CheckIcon color="green.600" />
            </Tooltip>
          ) : (
            <Tooltip
              label={intl.formatMessage({
                id: "component.preview-petition-field-adverse-media-search.rejected",
                defaultMessage: "This search has been rejected",
              })}
            >
              <CloseIcon fontSize="14px" color="red.500" />
            </Tooltip>
          )}
        </Center>
      ) : null}

      <IconButtonWithTooltip
        isDisabled={isViewDisabled}
        onClick={() => {
          onViewReply?.(reply);
        }}
        variant="ghost"
        icon={<EyeIcon />}
        size="md"
        placement="bottom"
        label={intl.formatMessage({
          id: "component.preview-petition-field-adverse-media-search.view-details",
          defaultMessage: "View details",
        })}
      />
      {onRemove !== undefined ? (
        <IconButtonWithTooltip
          isDisabled={isDisabled || reply.status === "APPROVED"}
          onClick={onRemove}
          variant="ghost"
          icon={<DeleteIcon />}
          size="md"
          placement="bottom"
          label={intl.formatMessage({
            id: "component.preview-petition-field-adverse-media-search.remove-reply-label",
            defaultMessage: "Remove reply",
          })}
        />
      ) : null}
    </HStack>
  );
}

interface AdverseMediaSearchArticleProps {
  id: string;
  article: AdverseMediaArticle;
  isDisabled: boolean;
  onViewArticle?: () => void;
  isViewDisabled?: boolean;
}

export function AdverseMediaSearchArticle({
  id,
  article,
  isDisabled,
  onViewArticle,
  isViewDisabled,
}: AdverseMediaSearchArticleProps) {
  const intl = useIntl();

  const timestamp = article.timestamp
    ? intl.formatDate(new Date(article.timestamp * 1000), FORMATS["L+LT"])
    : undefined;

  return (
    <HStack alignItems="center" backgroundColor="white" id={id}>
      <Center
        boxSize={10}
        borderRadius="md"
        border="1px solid"
        borderColor="gray.300"
        color="gray.600"
        boxShadow="sm"
        fontSize="xl"
      >
        <BookOpenIcon />
      </Center>
      <Box flex="1" overflow="hidden" paddingBottom="2px">
        <Flex minWidth={0} alignItems="baseline">
          <Stack gap={0.5}>
            <Text as="span" fontWeight="bold">
              {article.header}
            </Text>
            <Text as="span" fontSize="xs">
              {[timestamp, article.source].filter(isNonNullish).join(" | ")}
              {article.classifiedAt ? (
                <>
                  {" | "}
                  <FormattedMessage
                    id="generic.saved-on"
                    defaultMessage="Saved on {date}"
                    values={{
                      date: (
                        <DateTime value={article.classifiedAt ?? new Date()} format={FORMATS.LLL} />
                      ),
                    }}
                  />
                </>
              ) : null}
            </Text>
          </Stack>
        </Flex>
      </Box>

      <IconButtonWithTooltip
        isDisabled={isViewDisabled}
        onClick={onViewArticle}
        variant="ghost"
        icon={<EyeIcon />}
        size="md"
        placement="bottom"
        label={intl.formatMessage({
          id: "component.preview-petition-field-adverse-media-search.view-article",
          defaultMessage: "View article",
        })}
      />
    </HStack>
  );
}

const _fragments = {
  PetitionField: gql`
    fragment PreviewPetitionFieldAdverseMediaSearch_PetitionField on PetitionField {
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
    fragment PreviewPetitionFieldAdverseMediaSearch_PetitionBase on PetitionBase {
      id
      fields {
        id
        ...PreviewPetitionFieldAdverseMediaSearch_PetitionField
        children {
          id
          ...PreviewPetitionFieldAdverseMediaSearch_PetitionField
        }
      }
      permanentDeletionAt
      ...useFieldLogic_PetitionBase
    }
  `,
};
