import { gql } from "@apollo/client";
import {
  Box,
  Button,
  ButtonProps,
  Flex,
  Heading,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { CommentIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { RecipientViewPetitionFieldCard_PublicPetitionFieldFragment } from "@parallel/graphql/__types";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../../common/BreakLines";
import { RecipientViewCommentsBadge } from "../RecipientViewCommentsBadge";

export interface RecipientViewPetitionFieldCardProps {
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
  isInvalid: boolean;
  hasCommentsEnabled: boolean;
  onOpenCommentsClick: () => void;
  children: ReactNode;
}

export const RecipientViewPetitionFieldCard = Object.assign(
  chakraForwardRef<"section", RecipientViewPetitionFieldCardProps>(
    function RecipientViewPetitionFieldCard(
      {
        field,
        isInvalid,
        hasCommentsEnabled,
        onOpenCommentsClick,
        children,
        ...props
      },
      ref
    ) {
      const intl = useIntl();

      const isTextLikeType = ["TEXT", "SELECT"].includes(field.type);

      return (
        <Card
          ref={ref}
          padding={4}
          {...(isInvalid
            ? {
                border: "2px solid",
                borderColor: "red.500",
              }
            : {})}
          {...props}
        >
          <Flex alignItems="baseline">
            <Box flex="1" marginRight={2}>
              <Heading flex="1" as="h2" fontSize="md" overflowWrap="anywhere">
                {field.title || (
                  <Text
                    as="span"
                    color="gray.500"
                    fontWeight="normal"
                    fontStyle="italic"
                  >
                    <FormattedMessage
                      id="generic.untitled-field"
                      defaultMessage="Untitled field"
                    />
                  </Text>
                )}
                {field.optional ? (
                  <Text
                    as="span"
                    marginLeft={2}
                    color="gray.400"
                    fontSize="sm"
                    fontWeight="normal"
                  >
                    <FormattedMessage
                      id="generic.optional-field"
                      defaultMessage="Optional"
                    />
                  </Text>
                ) : (
                  <Tooltip
                    placement="right"
                    label={intl.formatMessage({
                      id: "generic.required-field",
                      defaultMessage: "Required field",
                    })}
                  >
                    <Text as="span" userSelect="none" marginLeft={1}>
                      *
                    </Text>
                  </Tooltip>
                )}
              </Heading>
            </Box>
            {hasCommentsEnabled ? (
              <CommentsButton
                commentCount={field.comments.length}
                hasUnreadComments={field.comments.some((c) => c.isUnread)}
                hasUnpublishedComments={field.comments.some(
                  (c) => !c.publishedAt
                )}
                onClick={onOpenCommentsClick}
              />
            ) : null}
          </Flex>
          <Box>
            {field.description ? (
              <Text
                fontSize="sm"
                color="gray.600"
                overflowWrap="anywhere"
                marginBottom={2}
              >
                <BreakLines text={field.description} />
              </Text>
            ) : null}
          </Box>
          <Text fontSize="sm" color="gray.500">
            {isTextLikeType ? (
              <FormattedMessage
                id="recipient-view.replies-submitted"
                defaultMessage="{count, plural, =0 {No replies have been submitted yet} =1 {1 reply submitted} other {# replies submitted}}"
                values={{ count: field.replies.length }}
              />
            ) : field.type === "FILE_UPLOAD" ? (
              <FormattedMessage
                id="recipient-view.files-uploaded"
                defaultMessage="{count, plural, =0 {No files have been uploaded yet} =1 {1 file uploaded} other {# files uploaded}}"
                values={{ count: field.replies.length }}
              />
            ) : null}
          </Text>
          {children}
        </Card>
      );
    }
  ),
  {
    fragments: {
      get PublicPetitionField() {
        return gql`
          fragment RecipientViewPetitionFieldCard_PublicPetitionField on PublicPetitionField {
            id
            type
            title
            description
            options
            optional
            multiple
            validated
            replies {
              ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
            }
            comments {
              id
              isUnread
              publishedAt
            }
          }
          ${this.PublicPetitionFieldReply}
        `;
      },
      get PublicPetitionFieldReply() {
        return gql`
          fragment RecipientViewPetitionFieldCard_PublicPetitionFieldReply on PublicPetitionFieldReply {
            id
            status
            content
            createdAt
            updatedAt
          }
        `;
      },
    },
  }
);

interface CommentsButtonProps extends ButtonProps {
  commentCount: number;
  hasUnreadComments: boolean;
  hasUnpublishedComments: boolean;
}

const CommentsButton = chakraForwardRef<"button", CommentsButtonProps>(
  function CommentsButton(
    { commentCount, hasUnreadComments, hasUnpublishedComments, ...props },
    ref
  ) {
    const intl = useIntl();
    const common = {
      size: "sm",
      fontWeight: "normal",
      "aria-label": intl.formatMessage(
        {
          id: "generic.comments-button-label",
          defaultMessage:
            "{commentCount, plural, =0 {No comments} =1 {# comment} other {# comments}}",
        },
        { commentCount }
      ),
      ...props,
    } as const;
    return commentCount > 0 ? (
      <Button ref={ref} rightIcon={<CommentIcon fontSize="16px" />} {...common}>
        <RecipientViewCommentsBadge
          hasUnreadComments={hasUnreadComments}
          hasUnpublishedComments={hasUnpublishedComments}
          marginRight={2}
        />
        {intl.formatNumber(commentCount)}
      </Button>
    ) : (
      <Button {...common}>
        <FormattedMessage
          id="recipient-view.questions-button"
          defaultMessage="Questions?"
        />
      </Button>
    );
  }
);
