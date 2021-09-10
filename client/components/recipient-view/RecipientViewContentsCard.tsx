import { gql } from "@apollo/client";
import { Box, Button, Flex, List, ListItem, Stack, Text, VisuallyHidden } from "@chakra-ui/react";
import { ChevronFilledIcon, CommentIcon } from "@parallel/chakra/icons";
import {
  RecipientViewContentsCard_PublicPetitionFieldFragment,
  RecipientViewContentsCard_PublicPetitionFragment,
  RecipientViewContentsCard_PublicUserFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { Maybe } from "@parallel/utils/types";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";
import { Card, CardHeader, CardProps } from "../common/Card";
import { NakedLink } from "../common/Link";
import { RecipientViewCommentsBadge } from "./RecipientViewCommentsBadge";

interface RecipientViewContentsCardProps extends CardProps {
  currentPage: number;
  hasCommentsEnabled: boolean;
  sender: RecipientViewContentsCard_PublicUserFragment;
  petition: RecipientViewContentsCard_PublicPetitionFragment;
}

export function RecipientViewContentsCard({
  currentPage,
  hasCommentsEnabled,
  sender,
  petition,
  ...props
}: RecipientViewContentsCardProps) {
  const { query } = useRouter();
  const { pages, fields } = useGetPagesAndFields(petition.fields, currentPage);

  const handleFocusField = (field: RecipientViewContentsCard_PublicPetitionFieldFragment) => {
    if (field.type === "SHORT_TEXT" || field.type === "TEXT") {
      const id = `reply-${field.id}-${field.replies[0]?.id ?? "new"}`;
      const element = document.getElementById(id) as HTMLInputElement;
      element?.focus();
      element?.setSelectionRange(element.value.length, element.value.length);
    }
  };

  return (
    <Card display="flex" flexDirection="column" {...props}>
      <CardHeader as="h3" size="sm">
        <FormattedMessage id="recipient-view.contents-header" defaultMessage="Contents" />
      </CardHeader>
      <Stack as={List} spacing={1} paddingY={2} paddingX={1.5}>
        {pages.map(({ title, commentCount, hasUnreadComments }, index) => (
          <ListItem key={index}>
            <Text as="h2">
              <NakedLink href={`/petition/${query.keycode}/${index + 1}`}>
                <Button
                  variant="ghost"
                  as="a"
                  size="sm"
                  fontSize="md"
                  display="flex"
                  width="100%"
                  paddingStart={7}
                  _focus={{ outline: "none" }}
                  aria-current={index + 1 !== currentPage ? "page" : undefined}
                >
                  <ChevronFilledIcon
                    position="absolute"
                    left={2}
                    top={2.5}
                    fontSize="sm"
                    transform={index + 1 !== currentPage ? "rotate(-90deg)" : undefined}
                  />
                  <Box
                    flex="1"
                    isTruncated
                    {...(title ? {} : { textStyle: "hint", fontWeight: "normal" })}
                  >
                    {title || (
                      <FormattedMessage
                        id="generic.empty-heading"
                        defaultMessage="Untitled heading"
                      />
                    )}
                  </Box>

                  {hasUnreadComments && index + 1 !== currentPage ? (
                    <RecipientViewContentsIndicators
                      hasUnreadComments={hasUnreadComments}
                      commentCount={commentCount}
                    />
                  ) : null}
                </Button>
              </NakedLink>
            </Text>
            {index + 1 === currentPage ? (
              <Stack as={List} spacing={1}>
                {fields.slice(1).map((field) => (
                  <ListItem key={field.id} position="relative">
                    <Text
                      as={field.type === "HEADING" ? "h3" : "div"}
                      display="flex"
                      position="relative"
                    >
                      <NakedLink href={`/petition/${query.keycode}/${index + 1}#field-${field.id}`}>
                        <Button
                          variant="ghost"
                          as="a"
                          size="sm"
                          fontSize="md"
                          display="flex"
                          width="100%"
                          paddingStart={7}
                          fontWeight={field.type === "HEADING" ? "bold" : "normal"}
                          _focus={{ outline: "none" }}
                          onClick={() => handleFocusField(field)}
                        >
                          <Box
                            flex="1"
                            isTruncated
                            {...(field.title
                              ? {
                                  color: field.replies.some((r) => r.status === "REJECTED")
                                    ? "red.600"
                                    : completedFieldReplies(field).length !== 0
                                    ? "gray.400"
                                    : "inherit",
                                }
                              : {
                                  color: field.validated ? "gray.500" : "red.600",
                                  fontWeight: "normal",
                                  fontStyle: "italic",
                                })}
                          >
                            {field.title ||
                              (field.type === "HEADING" ? (
                                <FormattedMessage
                                  id="generic.empty-heading"
                                  defaultMessage="Untitled heading"
                                />
                              ) : (
                                <FormattedMessage
                                  id="generic.untitled-field"
                                  defaultMessage="Untitled field"
                                />
                              ))}
                          </Box>
                          {field.commentCount ? (
                            <RecipientViewContentsIndicators
                              hasUnreadComments={!!field.unreadCommentCount}
                              commentCount={field.commentCount}
                            />
                          ) : null}
                        </Button>
                      </NakedLink>
                    </Text>
                  </ListItem>
                ))}
              </Stack>
            ) : null}
          </ListItem>
        ))}
      </Stack>
    </Card>
  );
}

function RecipientViewContentsIndicators({
  hasUnreadComments,
  commentCount,
}: {
  hasUnreadComments?: boolean;
  commentCount: number;
}) {
  const intl = useIntl();
  return (
    <Flex
      alignItems="center"
      color={hasUnreadComments ? "inherit" : "gray.500"}
      fontWeight="normal"
    >
      <RecipientViewCommentsBadge
        marginRight={2}
        boxSize={1.5}
        hasUnreadComments={hasUnreadComments}
      />
      <VisuallyHidden>
        <FormattedMessage
          id="component.recipient-view-content-card.comment-count"
          defaultMessage="{commentCount, plural, =1 {# comment} other {# comments}}"
          values={{ commentCount: commentCount }}
        />
      </VisuallyHidden>
      <Text as="span" fontSize="sm" aria-hidden>
        {intl.formatNumber(commentCount)}
      </Text>
      <CommentIcon marginLeft={1} role="presentation" fontSize="sm" />
    </Flex>
  );
}

function useGetPagesAndFields(
  fields: RecipientViewContentsCard_PublicPetitionFieldFragment[],
  page: number
) {
  const pages: {
    title: Maybe<string>;
    commentCount: number;
    hasUnreadComments?: boolean;
  }[] = [];
  const fieldVisibility = useFieldVisibility(fields);
  const _fields: RecipientViewContentsCard_PublicPetitionFieldFragment[] = [];
  for (const [field, isVisible] of zip(fields, fieldVisibility)) {
    if (field.type === "HEADING" && (pages.length === 0 || field.options.hasPageBreak)) {
      pages.push({ title: field.title ?? null, commentCount: 0 });
      page -= 1;
    }
    const currentPage = pages[pages.length - 1];
    currentPage.hasUnreadComments = currentPage.hasUnreadComments || field.unreadCommentCount > 0;
    currentPage.commentCount += field.commentCount;
    if (page === 0 && isVisible) {
      _fields.push(field);
    } else {
      continue;
    }
  }
  return { fields: _fields, pages };
}

RecipientViewContentsCard.fragments = {
  get PublicUser() {
    return gql`
      fragment RecipientViewContentsCard_PublicUser on PublicUser {
        firstName
      }
    `;
  },
  get PublicPetition() {
    return gql`
      fragment RecipientViewContentsCard_PublicPetition on PublicPetition {
        status
        fields {
          ...RecipientViewContentsCard_PublicPetitionField
        }
      }
      ${this.PublicPetitionField}
    `;
  },
  get PublicPetitionField() {
    return gql`
      fragment RecipientViewContentsCard_PublicPetitionField on PublicPetitionField {
        id
        type
        title
        options
        optional
        validated
        isReadOnly
        replies {
          id
          status
        }
        commentCount
        unreadCommentCount
        ...useFieldVisibility_PublicPetitionField
      }
      ${useFieldVisibility.fragments.PublicPetitionField}
    `;
  },
};
