import { gql } from "@apollo/client";
import { Box, Center, Flex, Heading, Text, Tooltip } from "@chakra-ui/react";
import { AddIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { Linkify } from "@parallel/components/common/Linkify";
import {
  RecipientViewPetitionFieldCard_PublicPetitionAccessFragment,
  RecipientViewPetitionFieldCard_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../../common/BreakLines";
import { CommentsButton } from "../CommentsButton";
import { RecipientViewFieldAttachment } from "./RecipientViewFieldAttachment";
import {
  RecipientViewPetitionFieldCommentsDialog,
  usePetitionFieldCommentsDialog,
} from "./RecipientViewPetitionFieldCommentsDialog";

export interface RecipientViewPetitionFieldCardProps {
  keycode: string;
  access: RecipientViewPetitionFieldCard_PublicPetitionAccessFragment;
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
  isInvalid: boolean;
  hasCommentsEnabled: boolean;
  showAddNewReply?: boolean;
  addNewReplyIsDisabled?: boolean;
  children: ReactNode;
  onAddNewReply?: () => void;
  onDownloadAttachment: (attachmentId: string) => void;
}

export function RecipientViewPetitionFieldCard({
  keycode,
  field,
  access,
  isInvalid,
  hasCommentsEnabled,
  showAddNewReply,
  addNewReplyIsDisabled,
  onAddNewReply,
  onDownloadAttachment,
  children,
}: RecipientViewPetitionFieldCardProps) {
  const intl = useIntl();

  const showFieldComments = usePetitionFieldCommentsDialog();
  async function handleCommentsButtonClick() {
    try {
      await showFieldComments({
        keycode,
        access,
        field,
      });
    } catch {}
  }

  const fieldReplies = completedFieldReplies(field);

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
        {hasCommentsEnabled ? (
          <CommentsButton
            commentCount={field.commentCount}
            hasUnreadComments={field.unreadCommentCount > 0}
            onClick={handleCommentsButtonClick}
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
            <RecipientViewFieldAttachment
              key={attachment.id}
              attachment={attachment}
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
  get PublicPetitionAccess() {
    return gql`
      fragment RecipientViewPetitionFieldCard_PublicPetitionAccess on PublicPetitionAccess {
        ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccess
      }
      ${RecipientViewPetitionFieldCommentsDialog.fragments.PublicPetitionAccess}
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
        validated
        replies {
          ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
        }
        attachments {
          ...RecipientViewFieldAttachment_PetitionFieldAttachment
        }
        commentCount
        unreadCommentCount
        ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
      }
      ${this.PublicPetitionFieldReply}
      ${RecipientViewFieldAttachment.fragments.PetitionFieldAttachment}
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
