import { gql } from "@apollo/client";
import { Box, Center, Flex, Heading, Text, Tooltip } from "@chakra-ui/react";
import { AddIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { FieldDescription } from "@parallel/components/common/FieldDescription";
import { FileAttachmentButton } from "@parallel/components/common/FileAttachmentButton";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { InternalFieldBadge } from "@parallel/components/common/InternalFieldBadge";
import {
  RecipientViewPetitionFieldCard_PetitionFieldFragment,
  RecipientViewPetitionFieldCard_PetitionFieldReplyFragment,
  RecipientViewPetitionFieldCard_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment,
  Tone,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
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
  showAddNewReply?: boolean;
  addNewReplyIsDisabled?: boolean;
  children: ReactNode;
  onAddNewReply?: () => void;
  onDownloadAttachment: (attachmentId: string) => void;
  onCommentsButtonClick?: () => void;
  tone?: Tone;
}

export function RecipientViewPetitionFieldCard({
  field,
  isInvalid,
  showAddNewReply,
  addNewReplyIsDisabled,
  onAddNewReply,
  onDownloadAttachment,
  children,
  onCommentsButtonClick,
  tone = "INFORMAL",
}: RecipientViewPetitionFieldCardProps) {
  const intl = useIntl();
  const isPetitionField = field.__typename === "PetitionField";
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
            {field.isInternal ? <InternalFieldBadge marginRight={2.5} marginBottom={0.5} /> : null}
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
        {field.hasCommentsEnabled || isPetitionField ? (
          <CommentsButton
            commentCount={field.commentCount}
            hasUnreadComments={field.unreadCommentCount > 0}
            onClick={onCommentsButtonClick}
          />
        ) : null}
      </Flex>
      {field.description ? (
        <FieldDescription
          description={field.description}
          color="gray.800"
          fontSize="sm"
          overflowWrap="anywhere"
          marginBottom={2}
        />
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

      {field.type !== "CHECKBOX" && field.type !== "NUMBER" ? (
        <Text fontSize="sm" color="gray.600">
          {field.type === "FILE_UPLOAD" ? (
            <FormattedMessage
              id="component.recipient-view-petition-field-card.files-uploaded"
              defaultMessage="{count, plural, =0 {No files have been uploaded yet} =1 {1 file uploaded} other {# files uploaded}}"
              values={{ count: fieldReplies.length }}
            />
          ) : field.type === "ES_TAX_DOCUMENTS" ? (
            <>
              <FormattedMessage
                id="component.recipient-view-petition-field-tax-documents.follow-steps-description"
                defaultMessage="Follow the steps to upload the documentation you need."
                values={{ tone }}
              />
              {fieldReplies.length ? (
                <>
                  {" ("}
                  <FormattedMessage
                    id="component.recipient-view-petition-field-card.files-uploaded"
                    defaultMessage="{count, plural, =0 {No files have been uploaded yet} =1 {1 file uploaded} other {# files uploaded}}"
                    values={{ count: fieldReplies.length }}
                  />
                  {")"}
                </>
              ) : null}
            </>
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
        isInternal
        replies {
          ...RecipientViewPetitionFieldCard_PetitionFieldReply
        }
        attachments {
          id
          file {
            ...FileAttachmentButton_FileUpload
          }
        }
        commentCount
        unreadCommentCount
        ...RecipientViewPetitionFieldCommentsDialog_PetitionField
        hasCommentsEnabled
        ...completedFieldReplies_PetitionField
      }
      ${this.PetitionFieldReply}
      ${FileAttachmentButton.fragments.FileUpload}
      ${RecipientViewPetitionFieldCommentsDialog.fragments.PetitionField}
      ${completedFieldReplies.fragments.PetitionField}
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
        isAnonymized
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
        isInternal
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
        hasCommentsEnabled
        ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
        ...completedFieldReplies_PublicPetitionField
      }
      ${this.PublicPetitionFieldReply}
      ${FileAttachmentButton.fragments.FileUpload}
      ${RecipientViewPetitionFieldCommentsDialog.fragments.PublicPetitionField}
      ${completedFieldReplies.fragments.PublicPetitionField}
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
        isAnonymized
      }
    `;
  },
};
