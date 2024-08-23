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
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { useFieldCommentsQueryState } from "@parallel/utils/useFieldCommentsQueryState";
import { MouseEvent, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
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
}: RecipientViewPetitionFieldLayoutProps) {
  const intl = useIntl();
  const isPetitionField = field.__typename === "PetitionField";
  const [commentsFieldId] = useFieldCommentsQueryState();
  return (
    <>
      <Flex alignItems="baseline" minHeight={6}>
        <Box flex="1" marginEnd={2}>
          <Heading flex="1" as="h2" fontSize="md" overflowWrap="anywhere">
            {field.isInternal ? <InternalFieldBadge marginEnd={2.5} marginBottom={0.5} /> : null}
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
                <Text as="span" userSelect="none" marginStart={1}>
                  *
                </Text>
              </Tooltip>
            )}
          </Heading>
        </Box>
        {(field.hasCommentsEnabled || isPetitionField) && isNonNullish(onCommentsButtonClick) ? (
          <CommentsButton
            commentCount={field.commentCount}
            hasUnreadComments={field.unreadCommentCount > 0}
            onClick={onCommentsButtonClick}
            backgroundColor={commentsFieldId === field.id ? "gray.300" : undefined}
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
        parent {
          id
        }
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
        parent {
          id
        }
      }
    `;
  },
};
