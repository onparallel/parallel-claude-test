import { gql } from "@apollo/client";
import { Box, Heading, HStack, List, ListItem, Stack, Text } from "@chakra-ui/react";
import { CommentIcon } from "@parallel/chakra/icons";
import {
  RecipientViewContentsCard_PublicPetitionFieldFragment,
  RecipientViewContentsCard_PublicPetitionFragment,
  RecipientViewContentsCard_PublicUserFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { Maybe } from "@parallel/utils/types";
import { useRouter } from "next/router";
import { createElement } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";
import { Card, CardProps } from "../common/Card";
import { Divider } from "../common/Divider";
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
  return (
    <Card display="flex" flexDirection="column" {...props}>
      <Box paddingX={4} paddingY={3}>
        <Heading display="flex" as="h3" fontSize="lg" alignItems="center">
          <FormattedMessage id="recipient-view.contents-header" defaultMessage="Contents" />
        </Heading>
      </Box>
      <Divider />
      <Stack as={List} spacing={1} paddingY={3}>
        {pages.map(({ title, hasUnreadComments }, index) => (
          <ListItem key={index}>
            <Text as="h2" display="flex" position="relative" fontWeight="bold" isTruncated>
              <NakedLink href={`/petition/${query.keycode}/${index + 1}`}>
                <Box
                  _hover={{ backgroundColor: "gray.75" }}
                  paddingX={5}
                  paddingY={1}
                  paddingLeft={5}
                  as="a"
                  display="block"
                  w="100%"
                >
                  <HStack spacing={1}>
                    <Box
                      width="0"
                      height="0"
                      borderLeft="5px solid transparent"
                      borderRight="5px solid transparent"
                      borderTop="8px solid"
                      borderTopColor="gray.500"
                      transform={index + 1 !== currentPage ? "rotate(-90deg)" : undefined}
                      transition="transform 0.2s ease"
                      marginLeft={-0.5}
                    ></Box>
                    <Box
                      flex="1"
                      cursor="pointer"
                      paddingRight={3}
                      isTruncated
                      {...(title
                        ? {}
                        : {
                            color: "gray.500",
                            fontWeight: "normal",
                            fontStyle: "italic",
                          })}
                    >
                      {title || (
                        <FormattedMessage
                          id="generic.empty-heading"
                          defaultMessage="Untitled heading"
                        />
                      )}
                    </Box>

                    {hasUnreadComments && index + 1 !== currentPage ? (
                      <Stack
                        as="span"
                        direction="row"
                        display="inline-flex"
                        alignItems="center"
                        position="relative"
                      >
                        <RecipientViewCommentsBadge hasUnreadComments={hasUnreadComments} />
                        <CommentIcon fontSize="sm" opacity="0.8" />
                      </Stack>
                    ) : null}
                  </HStack>
                </Box>
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
                      fontWeight={field.type === "HEADING" ? "bold" : "normal"}
                    >
                      <NakedLink href={`/petition/${query.keycode}/${index + 1}#field-${field.id}`}>
                        <Box
                          _hover={{ backgroundColor: "gray.75" }}
                          paddingX={8}
                          paddingY={1}
                          as="a"
                          display="block"
                          w="100%"
                        >
                          <HStack spacing={1}>
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
                            {field.commentCount
                              ? createElement(RecipientViewContentsIndicators, { field })
                              : null}
                          </HStack>
                        </Box>
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
  field,
}: {
  field: RecipientViewContentsCard_PublicPetitionFieldFragment;
}) {
  const intl = useIntl();
  return (
    <>
      {field.commentCount ? (
        <Stack as="span" direction="row-reverse" display="inline-flex" alignItems="center">
          <Stack
            as="span"
            direction="row-reverse"
            spacing={1.5}
            display="inline-flex"
            alignItems="center"
            color={!!field.unreadCommentCount ? "inherit" : "gray.500"}
          >
            <CommentIcon fontSize="sm" opacity="0.8" />
            <Text
              as="span"
              fontSize="xs"
              role="img"
              aria-label={intl.formatMessage(
                {
                  id: "generic.comments-button-label",
                  defaultMessage:
                    "{commentCount, plural, =0 {No comments} =1 {# comment} other {# comments}}",
                },
                { commentCount: field.commentCount }
              )}
            >
              {intl.formatNumber(field.commentCount)}
            </Text>
          </Stack>
          <RecipientViewCommentsBadge hasUnreadComments={!!field.unreadCommentCount} />
        </Stack>
      ) : null}
    </>
  );
}

function useGetPagesAndFields(
  fields: RecipientViewContentsCard_PublicPetitionFieldFragment[],
  page: number
) {
  const pages: {
    title: Maybe<string>;
    hasUnreadComments?: boolean;
  }[] = [];
  const fieldVisibility = useFieldVisibility(fields);
  const _fields: RecipientViewContentsCard_PublicPetitionFieldFragment[] = [];
  for (const [field, isVisible] of zip(fields, fieldVisibility)) {
    if (field.type === "HEADING" && (pages.length === 0 || field.options.hasPageBreak)) {
      pages.push({ title: field.title ?? null });
      page -= 1;
    }
    const currentPage = pages[pages.length - 1];
    currentPage.hasUnreadComments = currentPage.hasUnreadComments || field.unreadCommentCount > 0;
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
