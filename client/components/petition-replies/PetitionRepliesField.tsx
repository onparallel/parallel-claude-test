import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Flex,
  Heading,
  IconButton,
  keyframes,
  Stack,
  Switch,
  Text,
  Theme,
} from "@chakra-ui/react";
import { CommentIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import {
  PetitionFieldReplyStatus,
  PetitionRepliesField_PetitionFieldFragment,
  PetitionRepliesField_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { WithIsVisible } from "@parallel/utils/fieldVisibility/evalutateFieldVisibility";
import { FormattedMessage, useIntl } from "react-intl";
import { noop } from "remeda";
import { BreakLines } from "../common/BreakLines";
import { Spacer } from "../common/Spacer";
import { RecipientViewCommentsBadge } from "../recipient-view/RecipientViewCommentsBadge";
import {
  PetitionRepliesFieldAction,
  PetitionRepliesFieldReply,
} from "./PetitionRepliesFieldReply";

export interface PetitionRepliesFieldProps extends BoxProps {
  field: WithIsVisible<PetitionRepliesField_PetitionFieldFragment>;
  fieldIndex: number | string;
  index: number;
  commentCount: number;
  newCommentCount: number;
  isActive: boolean;
  onAction: (
    action: PetitionRepliesFieldAction,
    reply: PetitionRepliesField_PetitionFieldReplyFragment
  ) => void;
  onToggleComments: () => void;
  onUpdateReplyStatus: (
    replyId: string,
    status: PetitionFieldReplyStatus
  ) => void;
  onValidateToggle: () => void;
}

export function PetitionRepliesField({
  field,
  fieldIndex,
  index,
  commentCount,
  newCommentCount,
  isActive: isShowingComments,
  onAction,
  onToggleComments,
  onValidateToggle,
  onUpdateReplyStatus,
  ...props
}: PetitionRepliesFieldProps) {
  const intl = useIntl();
  return field.type === "HEADING" ? (
    <Stack
      spacing={1}
      paddingX={{ base: 4, md: 6 }}
      paddingY={2}
      as="section"
      {...props}
    >
      <Flex alignItems="center">
        <PetitionFieldTypeIndicator
          marginLeft="1px"
          type={field.type}
          fieldIndex={fieldIndex}
        />
        <Box flex="1" minWidth="0">
          {field.title ? (
            <Heading marginLeft={4} size="md" isTruncated>
              {field.title}
            </Heading>
          ) : (
            <Heading
              marginLeft={4}
              size="md"
              color="gray.500"
              fontWeight="normal"
              fontStyle="italic"
              isTruncated
            >
              <FormattedMessage
                id="generic.empty-heading"
                defaultMessage="Untitled heading"
              />
            </Heading>
          )}
        </Box>
      </Flex>
      {field.description ? (
        <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
          <BreakLines text={field.description} />
        </Text>
      ) : null}
    </Stack>
  ) : (
    <Card
      display="flex"
      backgroundColor={!field.isVisible ? "gray.100" : "inherit"}
      flexDirection="column"
      position="relative"
      _highlighted={{
        animation: ((theme: Theme) =>
          `${keyframes`
            0% { background-color: white; }
            25% { background-color: ${theme.colors.gray[100]}; }
            50% { background-color: white }
            75% { background-color: ${theme.colors.gray[100]}; }
            100% { background-color: white; }
          `} 500ms ease`) as any,
      }}
      paddingY={4}
      paddingX={{ base: 4, md: 6 }}
      {...props}
    >
      <Flex flexWrap="wrap" justifyContent="space-between">
        <Flex width={{ base: "100%", lg: "auto" }} flex="1">
          <PetitionFieldTypeIndicator
            marginTop="2px"
            type={field.type}
            fieldIndex={fieldIndex}
          />
          <Box marginLeft={4} flex="1">
            {field.title ? (
              <Text as="h4" overflowWrap="anywhere">
                {field.title}
              </Text>
            ) : (
              <Text as="h4" textStyle="hint" whiteSpace="nowrap">
                <FormattedMessage
                  id="generic.untitled-field"
                  defaultMessage="Untitled field"
                />
              </Text>
            )}
          </Box>
        </Flex>
        <Flex width={{ base: "100%", lg: "auto" }}>
          <Spacer />
          <Button
            size="sm"
            variant="ghost"
            onClick={onValidateToggle}
            aria-pressed={field.validated}
            aria-label={
              field.validated
                ? intl.formatMessage({
                    id: "petition-replies.validate-field-button.validated",
                    defaultMessage: "Reviewed",
                  })
                : intl.formatMessage({
                    id: "petition-replies.validate-field-button.not-validated",
                    defaultMessage: "Not reviewed",
                  })
            }
            marginRight={1}
          >
            <Switch
              color="green"
              isChecked={field.validated}
              onChange={noop}
              size="sm"
              pointerEvents="none"
              marginRight={2}
              position="relative"
              top="1px"
              aria-hidden={field.validated}
            />
            <FormattedMessage
              id="petition-replies.validate-field-button"
              defaultMessage="Reviewed"
            />
          </Button>
          {/* This Flex element makes the reviewed buttons to be aligned */}
          <Flex width="66px">
            <Spacer />
            <CommentsButton
              isActive={isShowingComments}
              commentCount={field.comments.length}
              hasUnreadComments={field.comments.some((c) => c.isUnread)}
              hasUnpublishedComments={field.comments.some(
                (c) => !c.publishedAt
              )}
              onClick={onToggleComments}
              id={`comment-${index}`}
            />
          </Flex>
        </Flex>
      </Flex>
      <Box marginBottom={2}>
        {field.description ? (
          <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
            <BreakLines text={field.description} />
          </Text>
        ) : (
          <Text fontSize="sm" textStyle="hint">
            <FormattedMessage
              id="generic.no-description"
              defaultMessage="No description"
            />
          </Text>
        )}
      </Box>
      {field.replies.length ? (
        <Stack spacing={4}>
          {field.replies.map((reply) => (
            <PetitionRepliesFieldReply
              key={reply.id}
              reply={reply}
              onAction={(action) => onAction(action, reply)}
              onUpdateStatus={(status) => onUpdateReplyStatus(reply.id, status)}
            />
          ))}
        </Stack>
      ) : field.isVisible ? (
        <Box paddingY={4}>
          <Text textStyle="hint" textAlign="center">
            <FormattedMessage
              id="petition-replies.petition-field.no-replies"
              defaultMessage="There are no replies to this field yet"
            />
          </Text>
        </Box>
      ) : (
        <Box paddingY={4}>
          <Text textStyle="hint" textAlign="center">
            <FormattedMessage
              id="petition-replies.petition-field.conditions-not-met"
              defaultMessage="Visibility conditions for this field are not met"
            />
          </Text>
        </Box>
      )}
    </Card>
  );
}

interface CommentsButtonProps extends ButtonProps {
  commentCount: number;
  hasUnreadComments: boolean;
  hasUnpublishedComments: boolean;
  isActive: boolean;
}

const CommentsButton = chakraForwardRef<"button", CommentsButtonProps>(
  function CommentsButton(
    {
      commentCount,
      hasUnreadComments,
      hasUnpublishedComments,
      isActive,
      ...props
    },
    ref
  ) {
    const intl = useIntl();
    const common = {
      "aria-pressed": isActive,
      size: "sm",
      variant: isActive ? "solid" : "ghost",
      colorScheme: isActive ? "purple" : "gray",
      ...props,
    } as const;
    return commentCount > 0 ? (
      <Button
        flexDirection="row-reverse"
        fontWeight="normal"
        alignItems="center"
        {...common}
        ref={ref}
      >
        <Stack
          display="inline-flex"
          direction="row-reverse"
          alignItems="flex-end"
        >
          <CommentIcon
            fontSize="md"
            color={isActive ? "inherit" : "gray.700"}
          />
          <Text
            as="span"
            aria-label={intl.formatMessage(
              {
                id: "generic.comments-button-label",
                defaultMessage:
                  "{commentCount, plural, =0 {No comments} =1 {# comment} other {# comments}}",
              },
              { commentCount }
            )}
          >
            {intl.formatNumber(commentCount)}
          </Text>
        </Stack>
        <RecipientViewCommentsBadge
          hasUnpublishedComments={hasUnpublishedComments}
          hasUnreadComments={hasUnreadComments}
          isReversedPurple={isActive}
          marginRight={2}
        />
      </Button>
    ) : (
      <IconButton
        icon={<CommentIcon />}
        {...common}
        aria-label={intl.formatMessage(
          {
            id: "generic.comments-button-label",
            defaultMessage:
              "{commentCount, plural, =0 {No comments} =1 {# comment} other {# comments}}",
          },
          { commentCount }
        )}
        ref={ref}
      />
    );
  }
);

PetitionRepliesField.fragments = {
  PetitionField: gql`
    fragment PetitionRepliesField_PetitionField on PetitionField {
      id
      type
      title
      description
      validated
      replies {
        ...PetitionRepliesField_PetitionFieldReply
      }
      comments {
        id
        isUnread
        publishedAt
      }
    }
    fragment PetitionRepliesField_PetitionFieldReply on PetitionFieldReply {
      id
      ...PetitionRepliesFieldReply_PetitionFieldReply
    }
    ${PetitionRepliesFieldReply.fragments.PetitionFieldReply}
  `,
};
