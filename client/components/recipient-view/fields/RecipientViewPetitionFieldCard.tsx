import { gql } from "@apollo/client";
import { Box, Center, Flex, Heading, Text, Tooltip } from "@chakra-ui/react";
import { AddIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { FileAttachmentButton } from "@parallel/components/common/FileAttachmentButton";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { Linkify } from "@parallel/components/common/Linkify";
import {
  RecipientViewPetitionFieldCard_PetitionFieldFragment,
  RecipientViewPetitionFieldCard_PetitionFieldReplyFragment,
  RecipientViewPetitionFieldCard_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { countBy } from "remeda";
import { BreakLines } from "../../common/BreakLines";
import { CommentsButton } from "../CommentsButton";
import { RecipientViewPetitionFieldCommentsDialog } from "../dialogs/RecipientViewPetitionFieldCommentsDialog";

export type RecipientViewPetitionFieldCard_PetitionFieldSelection =
  | RecipientViewPetitionFieldCard_PublicPetitionFieldFragment
  | RecipientViewPetitionFieldCard_PetitionFieldFragment;

export type RecipientViewPetitionFieldCard_PetitionFieldReplySelection =
  | RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment
  | RecipientViewPetitionFieldCard_PetitionFieldReplyFragment;

export interface RecipientViewPetitionFieldCardProps {
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  isInvalid: boolean;
  hasCommentsEnabled: boolean;
  showAddNewReply?: boolean;
  addNewReplyIsDisabled?: boolean;
  children: ReactNode;
  onAddNewReply?: () => void;
  onDownloadAttachment: (attachmentId: string) => void;
  onCommentsButtonClick?: () => void;
}

export function RecipientViewPetitionFieldCard({
  field,
  isInvalid,
  hasCommentsEnabled,
  showAddNewReply,
  addNewReplyIsDisabled,
  onAddNewReply,
  onDownloadAttachment,
  children,
  onCommentsButtonClick,
}: RecipientViewPetitionFieldCardProps) {
  const intl = useIntl();

  const fieldReplies = completedFieldReplies(field);
  const { commentCount, unreadCommentCount } =
    field.__typename === "PublicPetitionField"
      ? field
      : field.__typename === "PetitionField"
      ? {
          commentCount: field.comments.length,
          unreadCommentCount: countBy(field.comments, (c) => c.isUnread),
        }
      : (null as never);

  return (
    <Card
      id={`field-${field.id}`}
      padding={4}
      overflow="hidden"
      {...(isInvalid
        ? {
            border: "2px solid",
            borderColor: "red.500",
          }
        : {})}
    >
      <Flex alignItems="baseline">
        <Box flex="1" marginRight={2}>
          <Heading flex="1" as="h2" fontSize="md" overflowWrap="anywhere">
            {field.title || (
              <Text as="span" color="gray.500" fontWeight="normal" fontStyle="italic">
                <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
              </Text>
            )}
            {field.optional ? null : (
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
        {hasCommentsEnabled || field.__typename === "PetitionField" ? (
          <CommentsButton
            commentCount={commentCount}
            hasUnreadComments={unreadCommentCount > 0}
            onClick={onCommentsButtonClick}
          />
        ) : null}
      </Flex>
      {field.description ? (
        <Text fontSize="sm" color="gray.600" overflowWrap="anywhere" marginBottom={2}>
          <Linkify>
            <BreakLines>{field.description}</BreakLines>
          </Linkify>
        </Text>
      ) : null}
      {field.attachments.length ? (
        <Flex flexWrap="wrap" gridGap={2} marginBottom={1}>
          {field.attachments.map((attachment) => (
            <FileAttachmentButton
              showDownloadIcon
              key={attachment.id}
              file={attachment.file}
              onClick={() => onDownloadAttachment(attachment.id)}
            />
          ))}
        </Flex>
      ) : null}

      {field.type !== "CHECKBOX" ? (
        <Text fontSize="sm" color="gray.500">
          {field.type === "FILE_UPLOAD" ? (
            <FormattedMessage
              id="component.recipient-view-petition-field-card.files-uploaded"
              defaultMessage="{count, plural, =0 {No files have been uploaded yet} =1 {1 file uploaded} other {# files uploaded}}"
              values={{ count: fieldReplies.length }}
            />
          ) : fieldReplies.length ? (
            <FormattedMessage
              id="component.recipient-view-petition-field-card.replies-submitted"
              defaultMessage="{count, plural, =1 {1 reply submitted} other {# replies submitted}}"
              values={{ count: fieldReplies.length }}
            />
          ) : null}
        </Text>
      ) : null}

      {children}
      {showAddNewReply ? (
        <Center marginTop={2}>
          <IconButtonWithTooltip
            isDisabled={addNewReplyIsDisabled}
            icon={<AddIcon />}
            variant="outline"
            isRound
            label={intl.formatMessage({
              id: "component.recipient-view-petition-field-card.add-another-reply",
              defaultMessage: "Add another reply",
            })}
            onClick={onAddNewReply}
          />
        </Center>
      ) : null}
    </Card>
  );
}

RecipientViewPetitionFieldCard.fragments = {
  get PetitionField() {
    return gql`
      fragment RecipientViewPetitionFieldCard_PetitionField on PetitionField {
        id
        type
        title
        description
        options
        optional
        multiple
        replies {
          ...RecipientViewPetitionFieldCard_PetitionFieldReply
        }
        attachments {
          id
          file {
            ...FileAttachmentButton_FileUpload
          }
        }
        comments {
          id
          isUnread
          isInternal
        }
        ...RecipientViewPetitionFieldCommentsDialog_PetitionField
      }
      ${this.PetitionFieldReply}
      ${FileAttachmentButton.fragments.FileUpload}
      ${RecipientViewPetitionFieldCommentsDialog.fragments.PetitionField}
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment RecipientViewPetitionFieldCard_PetitionFieldReply on PetitionFieldReply {
        id
        status
        content
        createdAt
        updatedAt
      }
    `;
  },
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
        replies {
          ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
        }
        attachments {
          id
          file {
            ...FileAttachmentButton_FileUpload
          }
        }
        commentCount
        unreadCommentCount
        ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
      }
      ${this.PublicPetitionFieldReply}
      ${FileAttachmentButton.fragments.FileUpload}
      ${RecipientViewPetitionFieldCommentsDialog.fragments.PublicPetitionField}
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
};
