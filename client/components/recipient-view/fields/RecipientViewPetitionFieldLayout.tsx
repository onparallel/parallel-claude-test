import { gql } from "@apollo/client";
import { Box, Center, Flex, Heading, Text, Tooltip } from "@chakra-ui/react";
import { AddIcon } from "@parallel/chakra/icons";
import { FieldDescription } from "@parallel/components/common/FieldDescription";
import { FileAttachmentButton } from "@parallel/components/common/FileAttachmentButton";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { InternalFieldBadge } from "@parallel/components/common/InternalFieldBadge";
import {
  RecipientViewPetitionFieldLayout_PetitionFieldFragment,
  RecipientViewPetitionFieldLayout_PetitionFieldReplyFragment,
  RecipientViewPetitionFieldLayout_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldLayout_PublicPetitionFieldReplyFragment,
  Tone,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { MouseEvent, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CommentsButton } from "../CommentsButton";

export type RecipientViewPetitionFieldLayout_PetitionFieldSelection =
  | RecipientViewPetitionFieldLayout_PublicPetitionFieldFragment
  | RecipientViewPetitionFieldLayout_PetitionFieldFragment;

export type RecipientViewPetitionFieldLayout_PetitionFieldReplySelection =
  | RecipientViewPetitionFieldLayout_PublicPetitionFieldReplyFragment
  | RecipientViewPetitionFieldLayout_PetitionFieldReplyFragment;

export interface RecipientViewPetitionFieldLayoutProps {
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  showAddNewReply?: boolean;
  addNewReplyIsDisabled?: boolean;
  children: ReactNode;
  onAddNewReply?: () => void;
  onDownloadAttachment: (attachmentId: string) => void;
  onCommentsButtonClick?: () => void;
  onMouseDownNewReply?: (event: MouseEvent<HTMLButtonElement>) => void;
  tone?: Tone;
}

export function RecipientViewPetitionFieldLayout({
  field,
  showAddNewReply,
  addNewReplyIsDisabled,
  onAddNewReply,
  onDownloadAttachment,
  children,
  onCommentsButtonClick,
  onMouseDownNewReply,
  tone = "INFORMAL",
}: RecipientViewPetitionFieldLayoutProps) {
  const intl = useIntl();
  const isPetitionField = field.__typename === "PetitionField";
  const fieldReplies = completedFieldReplies(field);
  return (
    <>
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
          ) : field.type === "DOW_JONES_KYC" ? (
            <>
              {fieldReplies.length ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-card.profiles-uploaded"
                  defaultMessage="{count, plural, =1 {1 profile uploaded} other {# profiles uploaded}}"
                  values={{ count: fieldReplies.length }}
                />
              ) : null}
            </>
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
            onMouseDown={onMouseDownNewReply}
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
    </>
  );
}

RecipientViewPetitionFieldLayout.fragments = {
  get PetitionField() {
    return gql`
      fragment RecipientViewPetitionFieldLayout_PetitionField on PetitionField {
        id
        type
        title
        description
        options
        optional
        multiple
        isInternal
        replies {
          ...RecipientViewPetitionFieldLayout_PetitionFieldReply
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
        ...completedFieldReplies_PetitionField
      }
      ${this.PetitionFieldReply}
      ${FileAttachmentButton.fragments.FileUpload}
      ${completedFieldReplies.fragments.PetitionField}
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment RecipientViewPetitionFieldLayout_PetitionFieldReply on PetitionFieldReply {
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
      fragment RecipientViewPetitionFieldLayout_PublicPetitionField on PublicPetitionField {
        id
        type
        title
        description
        options
        optional
        multiple
        isInternal
        replies {
          ...RecipientViewPetitionFieldLayout_PublicPetitionFieldReply
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
        ...completedFieldReplies_PublicPetitionField
      }
      ${this.PublicPetitionFieldReply}
      ${FileAttachmentButton.fragments.FileUpload}
      ${completedFieldReplies.fragments.PublicPetitionField}
    `;
  },
  get PublicPetitionFieldReply() {
    return gql`
      fragment RecipientViewPetitionFieldLayout_PublicPetitionFieldReply on PublicPetitionFieldReply {
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
