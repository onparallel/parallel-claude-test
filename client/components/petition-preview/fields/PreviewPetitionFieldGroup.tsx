import { gql } from "@apollo/client";
import { Box, Button, Flex, Stack, Text, useToast } from "@chakra-ui/react";
import { ChevronRightIcon, ImportIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NakedLink } from "@parallel/components/common/Link";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
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
import { RecipientViewPetitionFieldIdVerification } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldIdVerification";
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
  CreatePetitionFromProfilePrefillInput,
  PreviewPetitionFieldGroup_PetitionBaseFragment,
  PreviewPetitionFieldGroup_PetitionFieldDataFragment,
  PreviewPetitionFieldGroup_PetitionFieldFragment,
  PreviewPetitionFieldGroup_UserFragment,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { LiquidPetitionVariableProvider } from "@parallel/utils/liquid/LiquidPetitionVariableProvider";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useHasIdVerification } from "@parallel/utils/useHasIdVerification";
import { usePetitionCanFinalize } from "@parallel/utils/usePetitionCanFinalize";
import { useIntl } from "react-intl";
import { isNonNullish, isNullish, zip } from "remeda";
import {
  useCreateFieldGroupRepliesFromProfiles,
  usePrefillPetitionFromProfiles,
} from "../clientMutations";
import { usePreviewConfirmImportFromProfileDialog } from "../dialogs/PreviewConfirmImportFromProfileDialog";
import { usePreviewImportFromProfileDialog } from "../dialogs/PreviewImportFromProfileDialog";
import { usePreviewImportFromProfileFormatErrorDialog } from "../dialogs/PreviewImportFromProfileFormatErrorDialog";
import { PreviewPetitionFieldKyc } from "./PreviewPetitionFieldKyc";
import { PreviewPetitionFieldProfileSearch } from "./PreviewPetitionFieldProfileSearch";
import { PreviewPetitionFieldAdverseMediaSearch } from "./adverse-media-search/PreviewPetitionFieldAdverseMediaSearch";
import { PreviewPetitionFieldBackgroundCheck } from "./background-check/PreviewPetitionFieldBackgroundCheck";

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
  onCreateFileReply: (
    content: { file: File; password?: string }[],
    fieldId: string,
    parentReplyId: string,
  ) => void;
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

  const showErrorToast = useGenericErrorToast();
  const showToast = useToast();

  const replies =
    isCacheOnly && field.__typename === "PetitionField" ? field.previewReplies : field.replies;

  const isLinkedToProfileType = isNonNullish(field.profileType);

  const showPreviewImportFromProfileDialog = usePreviewImportFromProfileDialog();
  const showConfirmImportFromProfileDialog = usePreviewConfirmImportFromProfileDialog();
  const createFieldGroupRepliesFromProfiles = useCreateFieldGroupRepliesFromProfiles();
  const prefillPetitionFromProfiles = usePrefillPetitionFromProfiles();
  const showPreviewImportFromProfileFormatErrorDialog =
    usePreviewImportFromProfileFormatErrorDialog();

  const handleImportFromProfile = async (groupId?: string) => {
    if (isNullish(field.profileType)) {
      return;
    }

    try {
      const group = field.replies.find((r) => r.id === groupId) ?? field.replies[0];
      // If is called from one reply of the group we check if children have some replies
      const childrenHaveReplies = groupId
        ? group.children!.some((c) => c.replies.length > 0)
        : false;
      const response:
        | { profileIds: string[] }
        | { prefill: CreatePetitionFromProfilePrefillInput[] } =
        await showPreviewImportFromProfileDialog({
          profileTypeId: field.profileType.id,
          showMultipleSelect: !childrenHaveReplies && field.multiple,
          petitionId: petition.id,
          fieldId: field.id,
        });

      if ("profileIds" in response) {
        try {
          await createFieldGroupRepliesFromProfiles({
            petitionId: petition.id,
            petitionFieldId: field.id,
            parentReplyId: groupId,
            profileIds: response.profileIds,
            isCacheOnly,
          });
        } catch (e) {
          if (isApolloError(e, "NOTHING_TO_IMPORT_ERROR")) {
            try {
              const profileIds = e.graphQLErrors?.[0].extensions?.profileIds as string[];
              await showConfirmImportFromProfileDialog({
                profileIds,
              });
              await createFieldGroupRepliesFromProfiles({
                petitionId: petition.id,
                petitionFieldId: field.id,
                parentReplyId: groupId,
                profileIds: response.profileIds,
                isCacheOnly,
                force: true,
              });
            } catch (e) {
              if (!isDialogError(e)) {
                showErrorToast(e);
              }
              return;
            }
          } else if (isApolloError(e, "INVALID_FORMAT_ERROR")) {
            try {
              await showPreviewImportFromProfileFormatErrorDialog({
                profileIds: response.profileIds,
                profileTypeFieldIds: e.graphQLErrors?.[0].extensions
                  ?.profileTypeFieldIds as string[],
              });
              await createFieldGroupRepliesFromProfiles({
                petitionId: petition.id,
                petitionFieldId: field.id,
                parentReplyId: groupId,
                profileIds: response.profileIds,
                isCacheOnly,
                skipFormatErrors: true,
              });
            } catch {}
          } else if (!isDialogError(e)) {
            showErrorToast(e);
          }
          return;
        }
      } else {
        try {
          await prefillPetitionFromProfiles({
            petitionId: petition.id,
            parentReplyId: groupId,
            prefill: response.prefill,
            isCacheOnly,
          });
        } catch (e) {
          if (isApolloError(e, "NOTHING_TO_IMPORT_ERROR")) {
            try {
              const profileIds = e.graphQLErrors?.[0].extensions?.profileIds as string[];
              await showConfirmImportFromProfileDialog({ profileIds });
              await prefillPetitionFromProfiles({
                petitionId: petition.id,
                parentReplyId: groupId,
                prefill: response.prefill,
                isCacheOnly,
                force: true,
              });
            } catch (e) {
              if (!isDialogError(e)) {
                showErrorToast(e);
              }
              return;
            }
          } else if (isApolloError(e, "INVALID_FORMAT_ERROR")) {
            try {
              await showPreviewImportFromProfileFormatErrorDialog({
                profileIds: response.prefill.flatMap((p) => p.profileIds),
                profileTypeFieldIds: e.graphQLErrors?.[0].extensions
                  ?.profileTypeFieldIds as string[],
              });
              await prefillPetitionFromProfiles({
                petitionId: petition.id,
                parentReplyId: groupId,
                prefill: response.prefill,
                isCacheOnly,
                skipFormatErrors: true,
              });
            } catch {}
          } else if (!isDialogError(e)) {
            showErrorToast(e);
          }
          return;
        }
      }
      onRefreshField();
      showToast({
        title: intl.formatMessage({
          id: "component.preview-petition-field-group.profile-successfully-imported",
          defaultMessage: "Profile successfully imported",
        }),
        status: "success",
      });
    } catch {}
  };

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
        addNewGroupAndFillWithProfileButton={
          isDisabled ||
          !isLinkedToProfileType ||
          (petition.__typename === "Petition"
            ? petition.status === "CLOSED"
            : false) ? undefined : (
            <Button onClick={() => handleImportFromProfile()} leftIcon={<ImportIcon />}>
              <Text>
                {intl.formatMessage({
                  id: "component.recipient-view-petition-field-group.add-from-profile-button",
                  defaultMessage: "Add from profile",
                })}
              </Text>
            </Button>
          )
        }
        composeUrl={buildUrlToSection("compose", { field: field.id })}
      >
        {zip(replies, fieldLogic.groupChildrenLogic!).map(([group, groupLogic], index) => {
          const groupHasSomeReply = group.children!.some((c) => c.replies.length > 0);
          const groupHasSomeApprovedReply = group.children!.some((c) =>
            c.replies.some((r) => r.status === "APPROVED"),
          );

          const iconButtonReviewReply = (
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
                      isDisabled={isDisabled || field.options.replyOnlyFromProfile === true}
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

              {petition.__typename === "PetitionTemplate" && !isLinkedToProfileType ? null : (
                <Flex
                  display={{ base: "none", xl: "flex" }}
                  position="absolute"
                  alignItems="flex-start"
                  top="0px"
                  insetEnd="-48px"
                  height="100%"
                  width="auto"
                  minWidth="48px"
                  padding={2}
                >
                  <Stack
                    className={"edit-preview-field-buttons"}
                    display="none"
                    position="sticky"
                    top={2}
                  >
                    {isLinkedToProfileType ? (
                      <IconButtonWithTooltip
                        icon={<ImportIcon boxSize={4} />}
                        size="sm"
                        colorScheme="purple"
                        placement="bottom"
                        onClick={() => handleImportFromProfile(group.id)}
                        label={intl.formatMessage({
                          id: "component.preview-petition-field-group.import-from-profile",
                          defaultMessage: "Import from profile",
                        })}
                      />
                    ) : null}

                    {petition.__typename === "PetitionTemplate" ? null : groupHasSomeReply ? (
                      <NakedLink href={buildUrlToSection("replies", { parentReply: group.id })}>
                        {iconButtonReviewReply}
                      </NakedLink>
                    ) : (
                      iconButtonReviewReply
                    )}
                  </Stack>
                </Flex>
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
  onCreateFileReply: (
    content: { file: File; password?: string }[],
    fieldId: string,
    parentReplyId: string,
  ) => void;
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
          onCreateReply={async (content: { file: File; password?: string }[]) => {
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
      ) : field.type === "ADVERSE_MEDIA_SEARCH" ? (
        <PreviewPetitionFieldAdverseMediaSearch
          {...commonProps}
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
      ) : field.type === "PROFILE_SEARCH" ? (
        <PreviewPetitionFieldProfileSearch
          {...commonProps}
          user={user}
          petition={petition}
          onRefreshField={onRefreshField}
          isCacheOnly={isCacheOnly}
        />
      ) : null}
    </Box>
  );
}

PreviewPetitionFieldGroup.fragments = {
  User: gql`
    fragment PreviewPetitionFieldGroup_User on User {
      ...PreviewPetitionFieldBackgroundCheck_User
      ...PreviewPetitionFieldProfileSearch_User
    }
    ${PreviewPetitionFieldBackgroundCheck.fragments.User}
    ${PreviewPetitionFieldProfileSearch.fragments.User}
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
      multiple
      profileType {
        id
      }
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
      ...useCreateFieldGroupRepliesFromProfiles_PetitionField
    }
    fragment PreviewPetitionFieldGroup_PetitionFieldData on PetitionField {
      ...RecipientViewPetitionFieldLayout_PetitionField
    }
    ${RecipientViewPetitionFieldCard.fragments.PetitionField}
    ${RecipientViewPetitionFieldLayout.fragments.PetitionField}
    ${RecipientViewPetitionFieldLayout.fragments.PetitionFieldReply}
    ${useCreateFieldGroupRepliesFromProfiles.fragments.PetitionField}
  `,
};
