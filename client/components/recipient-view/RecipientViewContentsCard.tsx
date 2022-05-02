import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Flex,
  List,
  ListItem,
  Stack,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import { ChevronFilledIcon, CommentIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  RecipientViewContentsCard_PetitionBaseFragment,
  RecipientViewContentsCard_PetitionFieldFragment,
  RecipientViewContentsCard_PublicPetitionFieldFragment,
  RecipientViewContentsCard_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { Maybe, UnionToArrayUnion } from "@parallel/utils/types";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";
import { Card, CardHeader } from "../common/Card";
import { InternalFieldBadge } from "../common/InternalFieldBadge";
import { NakedLink } from "../common/Link";
import { RecipientViewCommentsBadge } from "./RecipientViewCommentsBadge";

type PetitionSelection =
  | RecipientViewContentsCard_PublicPetitionFragment
  | RecipientViewContentsCard_PetitionBaseFragment;

type PetitionFieldSelection =
  | RecipientViewContentsCard_PublicPetitionFieldFragment
  | RecipientViewContentsCard_PetitionFieldFragment;

interface RecipientViewContentsCardProps {
  currentPage: number;
  petition: PetitionSelection;
  usePreviewReplies?: boolean;
}

export const RecipientViewContentsCard = chakraForwardRef<
  "section",
  RecipientViewContentsCardProps
>(function RecipientViewContentsCard({ currentPage, petition, usePreviewReplies, ...props }, ref) {
  const { query } = useRouter();
  const { pages, fields } = useGetPagesAndFields(petition.fields, currentPage, usePreviewReplies);

  const handleFocusField = (field: PetitionFieldSelection) => {
    if (field.type === "SHORT_TEXT" || field.type === "TEXT") {
      const id = `reply-${field.id}-${field.replies[0]?.id ?? "new"}`;
      const element = document.getElementById(id) as HTMLInputElement;
      element?.focus();
      if (element.type === "text") {
        // setSelectionRange does not work on inputs that are not type="text" (e.g. email)
        element?.setSelectionRange?.(element.value.length, element.value.length);
      }
    }
  };

  const filteredFields = (fields as PetitionFieldSelection[])
    .filter((field) =>
      (field.__typename === "PublicPetitionField" && field.isInternal) ||
      (field.type === "HEADING" && !field.title)
        ? false
        : true
    )
    // skip first one as long it has a title otherwise skip nothing as it's been filtered our before
    .slice(fields[0].title ? 1 : 0) as typeof fields;

  const showCommentsCount = (field: PetitionFieldSelection) => {
    return (
      field.commentCount > 0 && (field.__typename === "PetitionField" || field.hasCommentsEnabled)
    );
  };

  return (
    <Card ref={ref} display="flex" flexDirection="column" {...props}>
      <CardHeader as="h3" size="sm">
        <FormattedMessage id="recipient-view.contents-header" defaultMessage="Contents" />
      </CardHeader>
      <Stack as={List} spacing={1} paddingY={2} paddingX={1.5} minHeight="10rem" overflow="auto">
        {pages.map(
          (
            {
              title,
              commentCount,
              hasUnreadComments,
              isInternal,
              currentFieldCommentCount,
              currentFieldHasUnreadComments,
            },
            index
          ) => {
            const url = query.petitionId
              ? `/app/petitions/${query.petitionId}/preview?page=${index + 1}`
              : `/petition/${query.keycode}/${index + 1}`;

            const showPageCommentsCount = index + 1 !== currentPage;

            const showCommentsNumber = showPageCommentsCount
              ? commentCount > 0
              : currentFieldCommentCount > 0;
            const _commentCount = showPageCommentsCount ? commentCount : currentFieldCommentCount;
            const _hasUnreadComments = showPageCommentsCount
              ? hasUnreadComments
              : currentFieldHasUnreadComments;

            return (
              <ListItem key={index}>
                <Text as="h2">
                  <NakedLink href={url}>
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
                        color="gray.500"
                        position="absolute"
                        left={2}
                        top={2.5}
                        fontSize="sm"
                        transform={index + 1 === currentPage ? "rotate(90deg)" : undefined}
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
                      {showCommentsNumber ? (
                        <RecipientViewContentsIndicators
                          hasUnreadComments={_hasUnreadComments}
                          commentCount={_commentCount}
                        />
                      ) : null}
                      {isInternal ? (
                        <Center>
                          <InternalFieldBadge marginLeft={2} />
                        </Center>
                      ) : null}
                    </Button>
                  </NakedLink>
                </Text>
                {index + 1 === currentPage ? (
                  <Stack as={List} spacing={1}>
                    {filteredFields.map((field) => {
                      return (
                        <ListItem key={field.id} position="relative">
                          <Text
                            as={field.type === "HEADING" ? "h3" : "div"}
                            display="flex"
                            position="relative"
                          >
                            <NakedLink href={`${url}#field-${field.id}`}>
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
                                        color: field.replies.some((r) => r.status === "REJECTED")
                                          ? "red.600"
                                          : "gray.500",
                                        fontWeight: "normal",
                                        fontStyle: "italic",
                                      })}
                                >
                                  {field.title || (
                                    <FormattedMessage
                                      id="generic.untitled-field"
                                      defaultMessage="Untitled field"
                                    />
                                  )}
                                </Box>
                                {showCommentsCount(field) ? (
                                  <RecipientViewContentsIndicators
                                    hasUnreadComments={field.unreadCommentCount > 0}
                                    commentCount={field.commentCount}
                                  />
                                ) : null}
                                {field.isInternal ? <InternalFieldBadge marginLeft={2} /> : null}
                              </Button>
                            </NakedLink>
                          </Text>
                        </ListItem>
                      );
                    })}
                  </Stack>
                ) : null}
              </ListItem>
            );
          }
        )}
      </Stack>
    </Card>
  );
});

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
      <Text as="span" fontSize="sm" aria-hidden height="12px" lineHeight="12px">
        {intl.formatNumber(commentCount)}
      </Text>
      <CommentIcon marginLeft={1} role="presentation" fontSize="sm" />
    </Flex>
  );
}

function useGetPagesAndFields<T extends UnionToArrayUnion<PetitionFieldSelection>>(
  fields: T,
  page: number,
  usePreviewReplies?: boolean
) {
  const pages: {
    title: Maybe<string>;
    commentCount: number;
    hasUnreadComments?: boolean;
    isInternal: boolean;
    currentFieldCommentCount: number;
    currentFieldHasUnreadComments: boolean;
  }[] = [];
  const visibility = useFieldVisibility(fields, usePreviewReplies);
  const _fields: T = [] as any;
  for (const [field, isVisible] of zip<PetitionFieldSelection, boolean>(fields, visibility)) {
    const isHiddenToPublic = field.__typename === "PublicPetitionField" && field.isInternal;

    if (
      field.type === "HEADING" &&
      (pages.length === 0 || (field.options.hasPageBreak && !isHiddenToPublic))
    ) {
      pages.push({
        title: field.title ?? null,
        commentCount: 0,
        isInternal: field.isInternal,
        currentFieldCommentCount: field.commentCount,
        currentFieldHasUnreadComments: field.unreadCommentCount > 0,
      });
      page -= 1;
    }
    const currentPage = pages[pages.length - 1];
    if (currentPage) {
      currentPage.hasUnreadComments = currentPage.hasUnreadComments || field.unreadCommentCount > 0;
      currentPage.commentCount += field.commentCount;
    }

    if (page === 0 && isVisible) {
      _fields.push(field as any);
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
        isInternal
        isReadOnly
        replies {
          id
          status
        }
        commentCount
        unreadCommentCount
        hasCommentsEnabled
        ...useFieldVisibility_PublicPetitionField
      }
      ${useFieldVisibility.fragments.PublicPetitionField}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment RecipientViewContentsCard_PetitionBase on PetitionBase {
        fields {
          ...RecipientViewContentsCard_PetitionField
        }
      }
      ${this.PetitionField}
    `;
  },
  get PetitionField() {
    return gql`
      fragment RecipientViewContentsCard_PetitionField on PetitionField {
        id
        type
        title
        options
        optional
        isInternal
        isReadOnly
        replies {
          id
          status
        }
        commentCount
        unreadCommentCount
        hasCommentsEnabled
        ...useFieldVisibility_PetitionField
      }
      ${useFieldVisibility.fragments.PetitionField}
    `;
  },
};
