import { gql } from "@apollo/client";
import { Box, Heading, List, ListItem, Stack, Text } from "@chakra-ui/react";
import {
  RecipientViewContentsCard_PublicPetitionFieldFragment,
  RecipientViewContentsCard_PublicPetitionFragment,
  RecipientViewContentsCard_PublicUserFragment,
} from "@parallel/graphql/__types";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { Maybe } from "@parallel/utils/types";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import { zip } from "remeda";
import { Card, CardProps } from "../common/Card";
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
    <Card padding={4} display="flex" flexDirection="column" {...props}>
      <Heading display="flex" as="h3" fontSize="lg" marginBottom={2} alignItems="center">
        <FormattedMessage id="recipient-view.contents-header" defaultMessage="Contents" />
      </Heading>
      <Stack as={List} spacing={1} marginBottom={4}>
        {pages.map(({ title, hasUnreadComments }, index) => (
          <ListItem key={index}>
            <Text
              as="h2"
              display="flex"
              paddingLeft={4}
              position="relative"
              fontWeight="bold"
              isTruncated
            >
              {hasCommentsEnabled && index + 1 !== currentPage ? (
                <RecipientViewCommentsBadge
                  hasUnreadComments={hasUnreadComments}
                  position="absolute"
                  left="0"
                  top="50%"
                  transform="translate(0, -50%)"
                />
              ) : null}
              <NakedLink href={`/petition/${query.keycode}/${index + 1}`}>
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
            {index + 1 === currentPage ? (
              <Stack as={List} spacing={1} paddingLeft={pages.length > 1 ? 2 : 0}>
                {fields.slice(1).map((field) => (
                  <ListItem key={field.id} position="relative">
                    <Text
                      as={field.type === "HEADING" ? "h3" : "div"}
                      display="flex"
                      position="relative"
                      paddingLeft={4}
                      fontWeight={field.type === "HEADING" ? "bold" : "normal"}
                    >
                      {hasCommentsEnabled ? (
                        <RecipientViewCommentsBadge
                          hasUnreadComments={field.unreadCommentCount > 0}
                          position="absolute"
                          left="0"
                          top="50%"
                          transform="translate(0, -50%)"
                        />
                      ) : null}

                      <NakedLink href={`/petition/${query.keycode}/${index + 1}#field-${field.id}`}>
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
        isReadOnly
        replies {
          id
        }
        commentCount
        unreadCommentCount
        ...useFieldVisibility_PublicPetitionField
      }
      ${useFieldVisibility.fragments.PublicPetitionField}
    `;
  },
};
