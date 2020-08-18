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
        <FormattedMessage
          id="recipient-view.contents-header"
          defaultMessage="Contents"
        />
      </Heading>
      <Stack as={List} spacing={1} marginBottom={4}>
        {pages.map(({ title, fake, ...badge }, index) => (
          <ListItem key={index}>
            {/* On old petitions where there's no initial heading don't show anything */}
            {fake && pages.length === 1 ? null : (
              <Text
                as="h2"
                display="flex"
                paddingLeft={4}
                position="relative"
                fontWeight="bold"
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
                  <Box
                    as="a"
                    display="block"
                    flex="1"
                    cursor="pointer"
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
                </NakedLink>
              </Text>
            )}
            {index + 1 === currentPage ? (
              <Stack
                as={List}
                spacing={1}
                paddingLeft={pages.length > 1 ? 4 : 0}
              >
                {fields.map(({ field, ...badge }) => (
                  <ListItem key={field.id} position="relative">
                    <Text
                      as={field.type === "HEADING" ? "h3" : "div"}
                      display="flex"
                      position="relative"
                      paddingLeft={4}
                      fontWeight={field.type === "HEADING" ? "bold" : "normal"}
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
                        <Box
                          as="a"
                          display="block"
                          flex="1"
                          cursor="pointer"
                          isTruncated
                          {...(field.title
                            ? {}
                            : {
                                color: "gray.500",
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
    fake?: boolean;
  }[] = [];
  const _fields: {
    field: RecipientViewContentsCard_PublicPetitionFieldFragment;
    hasUnpublishedComments?: boolean;
    hasUnreadComments?: boolean;
  }[] = [];
  for (const [index, field] of Array.from(fields.entries())) {
    if (
      field.type === "HEADING" &&
      (index === 0 || field.options!.hasPageBreak)
    ) {
      pages.push({ title: field.title ?? null });
      page -= 1;
    }
    const hasUnreadComments = field.comments.some((c) => c.isUnread);
    const hasUnpublishedComments = field.comments.some((c) => !c.publishedAt);
    let currentPage = pages[pages.length - 1];
    if (!currentPage) {
      currentPage = { title: null, fake: true };
      pages.push(currentPage);
    }
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
