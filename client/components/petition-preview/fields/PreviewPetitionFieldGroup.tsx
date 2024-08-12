import { gql } from "@apollo/client";
import { Box, Center } from "@chakra-ui/react";
import { ChevronRightIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NakedLink } from "@parallel/components/common/Link";
import { RecipientViewPetitionFieldCard } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldCheckbox } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldCheckbox";
import { RecipientViewPetitionFieldDate } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldDate";
import { RecipientViewPetitionFieldDateTime } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldDateTime";
import { RecipientViewPetitionFieldDynamicSelect } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldDynamicSelect";
import { RecipientViewPetitionFieldFileUpload } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldFileUpload";
import {
  RecipientViewPetitionFieldGroupCard,
  RecipientViewPetitionFieldGroupLayout,
} from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldGroup";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
} from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldNumber } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldNumber";
import { RecipientViewPetitionFieldPhone } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldPhone";
import { RecipientViewPetitionFieldSelect } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldSelect";
import { RecipientViewPetitionFieldShortText } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldShortText";
import { RecipientViewPetitionFieldTaxDocuments } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldTaxDocuments";
import { RecipientViewPetitionFieldText } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldText";
import {
  PreviewPetitionFieldGroup_PetitionBaseFragment,
  PreviewPetitionFieldGroup_PetitionFieldDataFragment,
  PreviewPetitionFieldGroup_PetitionFieldFragment,
  PreviewPetitionFieldGroup_UserFragment,
} from "@parallel/graphql/__types";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/useFieldLogic";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { LiquidPetitionVariableProvider } from "@parallel/utils/liquid/LiquidPetitionVariableProvider";
import { usePetitionCanFinalize } from "@parallel/utils/usePetitionCanFinalize";
import { useIntl } from "react-intl";
import { zip } from "remeda";
import { PreviewPetitionFieldKyc } from "./PreviewPetitionFieldKyc";
import { PreviewPetitionFieldBackgroundCheck } from "./background-check/PreviewPetitionFieldBackgroundCheck";
import { RecipientViewPetitionFieldIdVerification } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldIdVerification";
import { useHasIdVerification } from "@parallel/utils/useHasIdVerification";

export interface PreviewPetitionFieldGroupProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "field" | "onDownloadAttachment"
  > {
  user: PreviewPetitionFieldGroup_UserFragment;
  field: PreviewPetitionFieldGroup_PetitionFieldFragment;
  isDisabled: boolean;
  isCacheOnly: boolean;
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
  petition: PreviewPetitionFieldGroup_PetitionBaseFragment;
  showErrors: boolean;
  fieldLogic: FieldLogicResult;
  onError: (error: any) => void;
  onDownloadAttachment: (fieldId: string) => (attachmentId: string) => Promise<void>;
}

export function PreviewPetitionFieldGroup({
  user,
  field,
  petition,
  isDisabled,
  isCacheOnly,
  onCommentsButtonClick,
  onDownloadAttachment,
  onUpdateReply,
  onDeleteReply,
  onCreateReply,
  onDownloadFileUploadReply,
  onCreateFileReply,
  onStartAsyncFieldCompletion,
  onRetryAsyncFieldCompletion,
  onRefreshField,
  onError,
  fieldLogic,
}: PreviewPetitionFieldGroupProps) {
  const intl = useIntl();
  const handleAddReply = async () => {
    await onCreateReply({});
  };
  const buildUrlToSection = useBuildUrlToPetitionSection();

  const replies =
    isCacheOnly && field.__typename === "PetitionField" ? field.previewReplies : field.replies;

  return (
    <>
      <RecipientViewPetitionFieldGroupLayout
        field={field}
        onCommentsButtonClick={onCommentsButtonClick}
        onDownloadAttachment={onDownloadAttachment(field.id)}
        onAddNewGroup={
          isDisabled || (petition.__typename === "Petition" ? petition.status === "CLOSED" : false)
            ? undefined
            : handleAddReply
        }
        composeUrl={buildUrlToSection("compose", { field: field.id })}
      >
        {zip(replies, fieldLogic.groupChildrenLogic!).map(([group, groupLogic], index) => {
          const groupHasSomeReply = group.children!.some((c) => c.replies.length > 0);
          const groupHasSomeApprovedReply = group.children!.some((c) =>
            c.replies.some((r) => r.status === "APPROVED"),
          );

          return (
            <RecipientViewPetitionFieldGroupCard
              key={index}
              field={field}
              index={index}
              isDisabled={
                groupHasSomeApprovedReply ||
                isDisabled ||
                (petition.__typename === "Petition" && petition.status === "CLOSED")
              }
              onRemoveReply={
                replies.length > 1 || field.optional
                  ? () => {
                      onDeleteReply(group.id);
                    }
                  : undefined
              }
              id={`reply-${group.id}`}
            >
              {zip(group.children!, groupLogic).map(([{ field, replies }, logic]) => {
                return (
                  <LiquidPetitionVariableProvider key={field.id} logic={logic}>
                    <PreviewPetitionFieldGroupField
                      user={user}
                      parentReplyId={group.id}
                      field={{ ...field, replies }}
                      petition={petition}
                      isDisabled={isDisabled}
                      isCacheOnly={isCacheOnly}
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
              {petition.__typename === "PetitionTemplate" ? null : (
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
                    <NakedLink href={buildUrlToSection("replies", { parentReply: group.id })}>
                      <IconButtonWithTooltip
                        as="a"
                        icon={<ChevronRightIcon boxSize={5} />}
                        size="sm"
                        variant="outline"
                        backgroundColor="white"
                        placement="bottom"
                        color="gray.600"
                        isDisabled={!groupHasSomeReply}
                        label={intl.formatMessage({
                          id: "component.preview-petition-field-group.review-reply",
                          defaultMessage: "Review reply",
                        })}
                      />
                    </NakedLink>
                  </Box>
                </Center>
              )}
            </RecipientViewPetitionFieldGroupCard>
          );
        })}
      </RecipientViewPetitionFieldGroupLayout>
    </>
  );
}

function PreviewPetitionFieldGroupField(props: {
  parentReplyId: string;
  user: PreviewPetitionFieldGroup_UserFragment;
  field: PreviewPetitionFieldGroup_PetitionFieldDataFragment;
  petition: PreviewPetitionFieldGroup_PetitionBaseFragment;
  isDisabled: boolean;
  isCacheOnly: boolean;
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
  const hasIdVerificationFeature = useHasIdVerification();

  const {
    parentReplyId,
    field,
    user,
    onDownloadFileUploadReply,
    onCreateFileReply,
    onStartAsyncFieldCompletion,
    onRetryAsyncFieldCompletion,
    onRefreshField,
    onDeleteReply,
    onUpdateReply,
    onCreateReply,
    isCacheOnly,
    petition,
    ...rest
  } = props;

  const commonProps = {
    field,
    parentReplyId,
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
      {field.type === "TEXT" ? (
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
          isCacheOnly={isCacheOnly}
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
          onStartAsyncFieldCompletion={async () => {
            return await onStartAsyncFieldCompletion(field.id, parentReplyId);
          }}
          onRetryAsyncFieldCompletion={async () => {
            return await onRetryAsyncFieldCompletion(field.id, parentReplyId);
          }}
          onRefreshField={onRefreshField}
          isCacheOnly={isCacheOnly}
        />
      ) : field.type === "DOW_JONES_KYC" ? (
        <PreviewPetitionFieldKyc
          {...commonProps}
          petition={petition}
          onDownloadReply={onDownloadFileUploadReply}
          onRefreshField={onRefreshField}
          isCacheOnly={isCacheOnly}
        />
      ) : field.type === "BACKGROUND_CHECK" ? (
        <PreviewPetitionFieldBackgroundCheck
          {...commonProps}
          user={user}
          petition={petition}
          onRefreshField={onRefreshField}
          isCacheOnly={isCacheOnly}
        />
      ) : field.type === "ID_VERIFICATION" ? (
        <RecipientViewPetitionFieldIdVerification
          {...commonProps}
          onStartAsyncFieldCompletion={async () => {
            return await onStartAsyncFieldCompletion(field.id, parentReplyId);
          }}
          onRefreshField={onRefreshField}
          isCacheOnly={isCacheOnly}
          hasIdVerificationFeature={hasIdVerificationFeature}
        />
      ) : null}
    </Box>
  );
}

PreviewPetitionFieldGroup.fragments = {
  User: gql`
    fragment PreviewPetitionFieldGroup_User on User {
      ...PreviewPetitionFieldBackgroundCheck_User
    }
    ${PreviewPetitionFieldBackgroundCheck.fragments.User}
  `,
  PetitionBase: gql`
    fragment PreviewPetitionFieldGroup_PetitionBase on PetitionBase {
      ... on Petition {
        status
      }
      ...PreviewPetitionFieldBackgroundCheck_PetitionBase
      ...PreviewPetitionFieldKyc_PetitionBase
      ...usePetitionCanFinalize_PetitionBase
    }
    ${PreviewPetitionFieldBackgroundCheck.fragments.PetitionBase}
    ${PreviewPetitionFieldKyc.fragments.PetitionBase}
    ${usePetitionCanFinalize.fragments.PetitionBase}
  `,
  PetitionField: gql`
    fragment PreviewPetitionFieldGroup_PetitionField on PetitionField {
      ...RecipientViewPetitionFieldCard_PetitionField
      ...PreviewPetitionFieldGroup_PetitionFieldData
      children {
        ...RecipientViewPetitionFieldLayout_PetitionField
      }
      replies {
        id
        children {
          field {
            id
            ...PreviewPetitionFieldGroup_PetitionFieldData
          }
          replies {
            id
            ...RecipientViewPetitionFieldLayout_PetitionFieldReply
          }
        }
      }
      previewReplies @client {
        id
        children {
          field {
            id
            ...RecipientViewPetitionFieldLayout_PetitionField
          }
          replies {
            id
            ...RecipientViewPetitionFieldLayout_PetitionFieldReply
          }
        }
      }
    }
    fragment PreviewPetitionFieldGroup_PetitionFieldData on PetitionField {
      ...RecipientViewPetitionFieldLayout_PetitionField
    }
    ${RecipientViewPetitionFieldCard.fragments.PetitionField}
    ${RecipientViewPetitionFieldLayout.fragments.PetitionField}
    ${RecipientViewPetitionFieldLayout.fragments.PetitionFieldReply}
  `,
};
