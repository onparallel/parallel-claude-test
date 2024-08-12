import { gql } from "@apollo/client";
import { Box, Button, Center, Flex, HStack, Heading, Stack, Text, Tooltip } from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditSimpleIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { ConfimationPopover } from "@parallel/components/common/ConfirmationPopover";
import { FieldDescription } from "@parallel/components/common/FieldDescription";
import { FileAttachmentButton } from "@parallel/components/common/FileAttachmentButton";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { InternalFieldBadge } from "@parallel/components/common/InternalFieldBadge";
import { NakedLink } from "@parallel/components/common/Link";
import { useTone } from "@parallel/components/common/ToneProvider";
import { CommentsButton } from "@parallel/components/recipient-view/CommentsButton";
import { RecipientViewPetitionFieldCheckbox } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldCheckbox";
import { RecipientViewPetitionFieldDate } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldDate";
import { RecipientViewPetitionFieldDateTime } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldDateTime";
import { RecipientViewPetitionFieldDynamicSelect } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldDynamicSelect";
import { RecipientViewPetitionFieldFileUpload } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldFileUpload";
import { RecipientViewPetitionFieldHeading } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldHeading";
import { RecipientViewPetitionFieldNumber } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldNumber";
import { RecipientViewPetitionFieldPhone } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldPhone";
import { RecipientViewPetitionFieldSelect } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldSelect";
import { RecipientViewPetitionFieldShortText } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldShortText";
import { RecipientViewPetitionFieldTaxDocuments } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldTaxDocuments";
import { RecipientViewPetitionFieldText } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldText";
import {
  RecipientViewPetitionFieldGroupCard_PetitionFieldFragment,
  RecipientViewPetitionFieldGroupCard_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldGroupLayout_PetitionFieldFragment,
  RecipientViewPetitionFieldGroupLayout_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldGroup_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldGroup_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/useFieldLogic";
import { LiquidPetitionVariableProvider } from "@parallel/utils/liquid/LiquidPetitionVariableProvider";
import { usePetitionCanFinalize } from "@parallel/utils/usePetitionCanFinalize";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, zip } from "remeda";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
} from "./RecipientViewPetitionFieldLayout";
import { useFieldCommentsQueryState } from "@parallel/utils/useFieldCommentsQueryState";
import { RecipientViewPetitionFieldIdVerification } from "./RecipientViewPetitionFieldIdVerification";

export interface RecipientViewPetitionFieldGroupProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "field" | "onDownloadAttachment"
  > {
  field: RecipientViewPetitionFieldGroup_PublicPetitionFieldFragment;
  isDisabled: boolean;
  onDeleteReply: (replyId: string, fieldId?: string, parentReplyId?: string) => void;
  onCreateReply: (
    content: any,
    fieldId?: string,
    parentReplyId?: string,
  ) => Promise<string | undefined>;
  onUpdateReply: (replyId: string, content: any) => Promise<void>;
  onRefreshField: () => void;
  onDownloadFileUploadReply: (replyId: string) => void;
  onCreateFileReply: (content: File[], fieldId: string, parentReplyId: string) => void;
  onStartAsyncFieldCompletion: () => Promise<{
    type: string;
    url: string;
  }>;
  onRetryAsyncFieldCompletion: (
    fieldId: string,
    parentReplyId: string,
  ) => Promise<{
    type: string;
    url: string;
  }>;
  petition: RecipientViewPetitionFieldGroup_PublicPetitionFragment;
  fieldLogic: FieldLogicResult;
  onError: (error: any) => void;
  onDownloadAttachment: (fieldId: string) => (attachmentId: string) => Promise<void>;
}

export function RecipientViewPetitionFieldGroup({
  field,
  isDisabled,
  onCommentsButtonClick,
  onDownloadAttachment,
  onUpdateReply,
  onDeleteReply,
  onCreateReply,
  onRefreshField,
  onDownloadFileUploadReply,
  onCreateFileReply,
  onStartAsyncFieldCompletion,
  onRetryAsyncFieldCompletion,
  petition,
  onError,
  fieldLogic,
}: RecipientViewPetitionFieldGroupProps) {
  const handleAddReply = async () => {
    await onCreateReply({});
  };

  return (
    <RecipientViewPetitionFieldGroupLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment(field.id)}
      onAddNewGroup={isDisabled || petition.status === "CLOSED" ? undefined : handleAddReply}
    >
      {zip(field.replies, fieldLogic.groupChildrenLogic!).map(([group, groupLogic], index) => {
        const groupHasSomeApprovedReply = group.children!.some((c) =>
          c.replies.some((r) => r.status === "APPROVED"),
        );
        return (
          <RecipientViewPetitionFieldGroupCard
            key={index}
            field={field}
            index={index}
            onRemoveReply={
              field.replies.length > 1 || field.optional
                ? async () => {
                    await onDeleteReply(group.id);
                  }
                : undefined
            }
            id={`reply-${group.id}`}
            isDisabled={groupHasSomeApprovedReply || isDisabled || petition.status === "CLOSED"}
          >
            {zip(group.children!, groupLogic).map(([{ field, replies }, logic]) => {
              return (
                <LiquidPetitionVariableProvider key={field.id} logic={logic}>
                  <RecipientViewPetitionFieldGroupField
                    parentReplyId={group.id}
                    field={{ ...field, replies }}
                    isDisabled={isDisabled}
                    onDownloadAttachment={onDownloadAttachment(field.id)}
                    onDeleteReply={onDeleteReply}
                    onUpdateReply={onUpdateReply}
                    onCreateReply={onCreateReply}
                    onDownloadFileUploadReply={onDownloadFileUploadReply}
                    onCreateFileReply={onCreateFileReply}
                    onStartAsyncFieldCompletion={onStartAsyncFieldCompletion}
                    onRetryAsyncFieldCompletion={onRetryAsyncFieldCompletion}
                    onRefreshField={onRefreshField}
                    onError={onError}
                  />
                </LiquidPetitionVariableProvider>
              );
            })}
          </RecipientViewPetitionFieldGroupCard>
        );
      })}
    </RecipientViewPetitionFieldGroupLayout>
  );
}

function RecipientViewPetitionFieldGroupField(props: {
  parentReplyId: string;
  field: RecipientViewPetitionFieldGroup_PublicPetitionFieldFragment;
  isInvalid?: boolean;
  isDisabled: boolean;
  onDownloadAttachment: (attachmentId: string) => void;
  onDeleteReply: (replyId: string, fieldId: string, parentReplyId: string) => void;
  onUpdateReply: (replyId: string, content: any, fieldId: string) => Promise<void>;
  onCreateReply: (
    content: any,
    fieldId: string,
    parentReplyId: string,
  ) => Promise<string | undefined>;
  onDownloadFileUploadReply: (replyId: string) => void;
  onCreateFileReply: (content: File[], fieldId: string, parentReplyId: string) => void;
  onStartAsyncFieldCompletion: (
    fieldId: string,
    parentReplyId: string,
  ) => Promise<{
    type: string;
    url: string;
  }>;
  onRetryAsyncFieldCompletion: (
    fieldId: string,
    parentReplyId: string,
  ) => Promise<{
    type: string;
    url: string;
  }>;
  onRefreshField: () => void;
  onError: (error: any) => void;
}) {
  const {
    parentReplyId,
    field,
    onDownloadFileUploadReply,
    onCreateFileReply,
    onStartAsyncFieldCompletion,
    onRetryAsyncFieldCompletion,
    onRefreshField,
    onDeleteReply,
    onCreateReply,
    onUpdateReply,
    ...rest
  } = props;

  const commonProps = {
    parentReplyId,
    field,
    onDeleteReply: async (replyId: string) => {
      await onDeleteReply(replyId, field.id, parentReplyId);
    },
    onCreateReply: async (content: any) => {
      return await onCreateReply(content, field.id, parentReplyId);
    },
    onUpdateReply: async (replyId: string, content: any) => {
      await onUpdateReply(replyId, content, field.id);
    },
    ...rest,
  };

  return (
    <Box id={`field-${field.id}-${parentReplyId}`}>
      {field.type === "HEADING" ? (
        <RecipientViewPetitionFieldHeading
          field={field}
          onDownloadAttachment={props.onDownloadAttachment}
          padding={0}
        />
      ) : field.type === "TEXT" ? (
        <RecipientViewPetitionFieldText {...commonProps} />
      ) : field.type === "SHORT_TEXT" ? (
        <RecipientViewPetitionFieldShortText {...commonProps} />
      ) : field.type === "SELECT" ? (
        <RecipientViewPetitionFieldSelect {...commonProps} />
      ) : field.type === "FILE_UPLOAD" ? (
        <RecipientViewPetitionFieldFileUpload
          {...commonProps}
          onDownloadReply={onDownloadFileUploadReply}
          onCreateReply={async (content: File[]) => {
            await onCreateFileReply(content, field.id, parentReplyId);
          }}
        />
      ) : field.type === "DYNAMIC_SELECT" ? (
        <RecipientViewPetitionFieldDynamicSelect {...commonProps} />
      ) : field.type === "CHECKBOX" ? (
        <RecipientViewPetitionFieldCheckbox {...commonProps} />
      ) : field.type === "NUMBER" ? (
        <RecipientViewPetitionFieldNumber {...commonProps} />
      ) : field.type === "DATE" ? (
        <RecipientViewPetitionFieldDate {...commonProps} />
      ) : field.type === "DATE_TIME" ? (
        <RecipientViewPetitionFieldDateTime {...commonProps} />
      ) : field.type === "PHONE" ? (
        <RecipientViewPetitionFieldPhone {...commonProps} />
      ) : field.type === "ES_TAX_DOCUMENTS" ? (
        <RecipientViewPetitionFieldTaxDocuments
          {...commonProps}
          onDownloadReply={onDownloadFileUploadReply}
          onStartAsyncFieldCompletion={async () =>
            await onStartAsyncFieldCompletion(field.id, parentReplyId)
          }
          onRetryAsyncFieldCompletion={async () =>
            await onRetryAsyncFieldCompletion(field.id, parentReplyId)
          }
          onRefreshField={onRefreshField}
          hideDeleteReplyButton
        />
      ) : field.type === "ID_VERIFICATION" ? (
        <RecipientViewPetitionFieldIdVerification
          {...commonProps}
          onStartAsyncFieldCompletion={async () => {
            return await onStartAsyncFieldCompletion(field.id, parentReplyId);
          }}
          onRefreshField={onRefreshField}
        />
      ) : null}
    </Box>
  );
}

type RecipientViewPetitionFieldGroupLayout_PetitionFieldSelection =
  | RecipientViewPetitionFieldGroupLayout_PetitionFieldFragment
  | RecipientViewPetitionFieldGroupLayout_PublicPetitionFieldFragment;

interface RecipientViewPetitionFieldGroupLayoutProps {
  field: RecipientViewPetitionFieldGroupLayout_PetitionFieldSelection;
  onDownloadAttachment: (attachmentId: string) => void;
  onCommentsButtonClick?: () => void;
  onAddNewGroup?: () => void;
  composeUrl?: string;
  children: ReactNode;
}

export function RecipientViewPetitionFieldGroupLayout({
  field,
  onDownloadAttachment,
  onCommentsButtonClick,
  onAddNewGroup,
  composeUrl,
  children,
}: RecipientViewPetitionFieldGroupLayoutProps) {
  const intl = useIntl();
  const isPetitionField = field.__typename === "PetitionField";
  const [commentsFieldId] = useFieldCommentsQueryState();

  return (
    <Stack spacing={4} as="section" id={`field-${field.id}`}>
      <Stack spacing={1} paddingX={2} position="relative">
        <Flex alignItems="baseline">
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
          {(field.hasCommentsEnabled || isPetitionField) && isDefined(onCommentsButtonClick) ? (
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
          />
        ) : null}
        {field.attachments.length ? (
          <Flex flexWrap="wrap" gridGap={2}>
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

        {isPetitionField && composeUrl ? (
          <Center
            display={{ base: "none", xl: "flex" }}
            position="absolute"
            top="0px"
            insetEnd="-48px"
            height="100%"
            width="auto"
            minWidth="48px"
            padding={2}
          >
            <Box className={"edit-preview-field-buttons"} display="none">
              <NakedLink href={composeUrl}>
                <IconButtonWithTooltip
                  as="a"
                  size="sm"
                  variant="outline"
                  backgroundColor="white"
                  placement="bottom"
                  color="gray.600"
                  icon={<EditSimpleIcon boxSize={4} />}
                  label={intl.formatMessage({
                    id: "component.recipient-view-petition-field-group.edit-field",
                    defaultMessage: "Edit field",
                  })}
                />
              </NakedLink>
            </Box>
          </Center>
        ) : null}
      </Stack>
      {children}
      {(field.replies.length > 0 && !field.multiple) || !isDefined(onAddNewGroup) ? null : (
        <Box paddingX={4}>
          <Button onClick={onAddNewGroup} leftIcon={<AddIcon />}>
            <Text>
              {intl.formatMessage(
                {
                  id: "component.recipient-view-petition-field-group.add-button",
                  defaultMessage: "Add {groupName}",
                },
                {
                  groupName: (
                    field.options.groupName ??
                    intl.formatMessage({
                      id: "generic.group-name-fallback-reply",
                      defaultMessage: "Reply",
                    })
                  ).toLowerCase(),
                },
              )}
            </Text>
          </Button>
        </Box>
      )}
    </Stack>
  );
}

type RecipientViewPetitionFieldGroupCard_PetitionFieldSelection =
  | RecipientViewPetitionFieldGroupCard_PetitionFieldFragment
  | RecipientViewPetitionFieldGroupCard_PublicPetitionFieldFragment;

interface RecipientViewPetitionFieldGroupCardProps {
  id: string;
  field: RecipientViewPetitionFieldGroupCard_PetitionFieldSelection;
  index: number;
  onRemoveReply?: () => void;
  isDisabled?: boolean;
  children: ReactNode;
}

export function RecipientViewPetitionFieldGroupCard({
  id,
  field,
  index,
  onRemoveReply,
  isDisabled,
  children,
}: RecipientViewPetitionFieldGroupCardProps) {
  const intl = useIntl();
  const tone = useTone();
  return (
    <Card as={Stack} padding={4} spacing={4} position="relative" id={id}>
      {field.multiple ? (
        <HStack minHeight="32px">
          <Text width="100%">
            {`${
              field.options.groupName ??
              intl.formatMessage({
                id: "generic.group-name-fallback-reply",
                defaultMessage: "Reply",
              })
            } ${index + 1}`}
          </Text>

          {isDefined(onRemoveReply) ? (
            <ConfimationPopover
              description={
                <FormattedMessage
                  id="component.recipient-view-petition-field-group.confirm-delete-group"
                  defaultMessage="Do you want to remove {groupName}?"
                  values={{
                    groupName: `${
                      field.options.groupName ??
                      intl.formatMessage({
                        id: "generic.group-name-fallback-reply",
                        defaultMessage: "Reply",
                      })
                    } ${index + 1}`,
                    tone,
                  }}
                />
              }
              confirm={
                <Button onClick={onRemoveReply} size="sm" colorScheme="red">
                  <FormattedMessage
                    id="component.recipient-view-petition-field-group.remove-confirmation-button"
                    defaultMessage="Remove"
                  />
                </Button>
              }
            >
              <IconButtonWithTooltip
                icon={<DeleteIcon boxSize={4} />}
                size="sm"
                variant="outline"
                placement="bottom"
                color="gray.600"
                label={intl.formatMessage(
                  {
                    id: "component.recipient-view-petition-field-group.remove-reply-button",
                    defaultMessage: "Remove {groupName}",
                  },
                  {
                    groupName: (
                      field.options.groupName ??
                      intl.formatMessage({
                        id: "generic.group-name-fallback-reply",
                        defaultMessage: "Reply",
                      })
                    ).toLowerCase(),
                  },
                )}
                isDisabled={isDisabled}
              />
            </ConfimationPopover>
          ) : null}
        </HStack>
      ) : null}
      {children}
    </Card>
  );
}

RecipientViewPetitionFieldGroupLayout.fragments = {
  PetitionField: gql`
    fragment RecipientViewPetitionFieldGroupLayout_PetitionField on PetitionField {
      id
      isInternal
      multiple
      title
      optional
      hasCommentsEnabled
      unreadCommentCount
      commentCount
      description
      attachments {
        id
        file {
          ...FileAttachmentButton_FileUpload
        }
      }
      options
      replies {
        id
      }
    }
    ${FileAttachmentButton.fragments.FileUpload}
  `,
  PublicPetitionField: gql`
    fragment RecipientViewPetitionFieldGroupLayout_PublicPetitionField on PublicPetitionField {
      id
      isInternal
      multiple
      title
      optional
      hasCommentsEnabled
      unreadCommentCount
      commentCount
      description
      attachments {
        id
        file {
          ...FileAttachmentButton_FileUpload
        }
      }
      options
      replies {
        id
      }
    }
    ${FileAttachmentButton.fragments.FileUpload}
  `,
};

RecipientViewPetitionFieldGroupCard.fragments = {
  PetitionField: gql`
    fragment RecipientViewPetitionFieldGroupCard_PetitionField on PetitionField {
      id
      options
      optional
      multiple
      replies {
        id
      }
    }
  `,
  PublicPetitionField: gql`
    fragment RecipientViewPetitionFieldGroupCard_PublicPetitionField on PublicPetitionField {
      id
      options
      optional
      multiple
      replies {
        id
      }
    }
  `,
};

RecipientViewPetitionFieldGroup.fragments = {
  PublicPetitionField: gql`
    fragment RecipientViewPetitionFieldGroup_PublicPetitionField on PublicPetitionField {
      id
      ...RecipientViewPetitionFieldLayout_PublicPetitionField
      ...RecipientViewPetitionFieldGroupCard_PublicPetitionField
      ...RecipientViewPetitionFieldGroupLayout_PublicPetitionField
      replies {
        id
        children {
          field {
            id
            ...RecipientViewPetitionFieldLayout_PublicPetitionField
          }
          replies {
            id
            status
            ...RecipientViewPetitionFieldLayout_PublicPetitionFieldReply
          }
        }
      }
      ...RecipientViewPetitionFieldLayout_PublicPetitionField
    }
    ${RecipientViewPetitionFieldLayout.fragments.PublicPetitionField}
    ${RecipientViewPetitionFieldLayout.fragments.PublicPetitionFieldReply}
    ${RecipientViewPetitionFieldGroupCard.fragments.PublicPetitionField}
    ${RecipientViewPetitionFieldGroupLayout.fragments.PublicPetitionField}
  `,
  PublicPetition: gql`
    fragment RecipientViewPetitionFieldGroup_PublicPetition on PublicPetition {
      status
      ...usePetitionCanFinalize_PublicPetition
    }
    ${usePetitionCanFinalize.fragments.PublicPetition}
  `,
};
