import { gql } from "@apollo/client";
import { Box, Heading, List, ListItem, Stack, Text } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import {
  Maybe,
  RecipientViewContentsCard_PublicPetitionFieldFragment,
  RecipientViewContentsCard_PublicPetitionFragment,
  RecipientViewContentsCard_PublicUserFragment,
} from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import { Card } from "../common/Card";
import { NakedLink } from "../common/Link";
import { RecipientViewCommentsBadge } from "./RecipientViewCommentsBadge";

export function RecipientViewContentsCard({
  currentPage,
  sender,
  petition,
  onFinalize,
  ...props
}: ExtendChakra<{
  currentPage: number;
  sender: RecipientViewContentsCard_PublicUserFragment;
  petition: RecipientViewContentsCard_PublicPetitionFragment;
  onFinalize: () => void;
}>) {
  const { query } = useRouter();
  const { pages, fields } = getPagesAndFields(petition.fields, currentPage);
  return (
    <Card padding={4} display="flex" flexDirection="column" {...props}>
      <Heading
        display="flex"
        as="h3"
        fontSize="lg"
        marginBottom={2}
        alignItems="center"
      >
        Contents
      </Heading>
      <Stack as={List} spacing={1} marginBottom={4}>
        {pages.map(({ title, ...badge }, index) => (
          <ListItem key={index}>
            <Text
              as="h2"
              position="relative"
              fontWeight="bold"
              paddingLeft={4}
              isTruncated
            >
              {index + 1 !== currentPage ? (
                <RecipientViewCommentsBadge
                  {...badge}
                  position="absolute"
                  left="0"
                  top="50%"
                  transform="translate(0, -50%)"
                />
              ) : null}
              <NakedLink
                href="/petition/[keycode]/[page]"
                as={`/petition/${query.keycode}/${index + 1}`}
              >
                <Box as="a" cursor="pointer">
                  {title || (
                    <Text
                      color="gray.500"
                      fontWeight="normal"
                      fontStyle="italic"
                    >
                      <FormattedMessage
                        id="generic.empty-heading"
                        defaultMessage="Untitled heading"
                      />
                    </Text>
                  )}
                </Box>
              </NakedLink>
            </Text>
            {index + 1 === currentPage ? (
              <Stack as={List} spacing={1} paddingLeft={4}>
                {fields.map(({ field, ...badge }) => (
                  <ListItem key={field.id} position="relative">
                    <Text
                      as="h3"
                      position="relative"
                      fontWeight="bold"
                      paddingLeft={4}
                    >
                      <RecipientViewCommentsBadge
                        {...badge}
                        position="absolute"
                        left="0"
                        top="50%"
                        transform="translate(0, -50%)"
                      />
                      <NakedLink
                        href="/petition/[keycode]/[page]"
                        as={`/petition/${query.keycode}/${index + 1}#field-${
                          field.id
                        }`}
                      >
                        <Box as="a" cursor="pointer">
                          {field.title || (
                            <Text
                              color="gray.500"
                              fontWeight="normal"
                              fontStyle="italic"
                            >
                              {field.type === "HEADING" ? (
                                <FormattedMessage
                                  id="generic.empty-heading"
                                  defaultMessage="Untitled heading"
                                />
                              ) : (
                                <FormattedMessage
                                  id="generic.untitled-field"
                                  defaultMessage="Untitled field"
                                />
                              )}
                            </Text>
                          )}
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

function getPagesAndFields(
  fields: RecipientViewContentsCard_PublicPetitionFieldFragment[],
  page: number
) {
  const pages: {
    title: Maybe<string>;
    hasUnpublishedComments?: boolean;
    hasUnreadComments?: boolean;
  }[] = [{ title: (fields[0]?.type === "HEADING" && fields[0].title) || null }];
  const _fields: {
    field: RecipientViewContentsCard_PublicPetitionFieldFragment;
    hasUnpublishedComments?: boolean;
    hasUnreadComments?: boolean;
  }[] = [];
  for (const field of fields) {
    if (field.type === "HEADING" && field.options!.hasPageBreak) {
      pages.push({ title: field.title ?? null });
      page -= 1;
    }
    const hasUnreadComments = field.comments.some((c) => c.isUnread);
    const hasUnpublishedComments = field.comments.some((c) => !c.publishedAt);
    const currentPage = pages[pages.length - 1];
    currentPage.hasUnreadComments =
      currentPage.hasUnreadComments || hasUnreadComments;
    currentPage.hasUnpublishedComments =
      currentPage.hasUnpublishedComments || hasUnpublishedComments;
    if (page === 1) {
      if (field.type !== "HEADING" || _fields.length !== 0) {
        _fields.push({ field, hasUnreadComments, hasUnpublishedComments });
      }
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
        isReadOnly
        replies {
          id
        }
        comments {
          id
          isUnread
          publishedAt
        }
      }
    `;
  },
};
