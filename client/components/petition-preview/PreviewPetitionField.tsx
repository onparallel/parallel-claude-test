import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
  PetitionPermissionType,
  PreviewPetitionField_PetitionBaseFragment,
  PreviewPetitionField_PetitionFieldFragment,
  PreviewPetitionField_PetitionFieldReplyFragmentDoc,
  PreviewPetitionField_UserFragment,
  PreviewPetitionField_petitionFieldAttachmentDownloadLinkDocument,
  PreviewPetitionField_queryDocument,
  PreviewPetitionField_retryAsyncFieldCompletionDocument,
  RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkDocument,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/useFieldLogic";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useCallback, useEffect, useRef } from "react";
import { pick } from "remeda";
import { useFailureGeneratingLinkDialog } from "../petition-replies/dialogs/FailureGeneratingLinkDialog";
import { RecipientViewPetitionFieldCard } from "../recipient-view/fields/RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldCheckbox } from "../recipient-view/fields/RecipientViewPetitionFieldCheckbox";
import { RecipientViewPetitionFieldDate } from "../recipient-view/fields/RecipientViewPetitionFieldDate";
import { RecipientViewPetitionFieldDateTime } from "../recipient-view/fields/RecipientViewPetitionFieldDateTime";
import { RecipientViewPetitionFieldDynamicSelect } from "../recipient-view/fields/RecipientViewPetitionFieldDynamicSelect";
import { RecipientViewPetitionFieldFileUpload } from "../recipient-view/fields/RecipientViewPetitionFieldFileUpload";
import { RecipientViewPetitionFieldHeading } from "../recipient-view/fields/RecipientViewPetitionFieldHeading";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
} from "../recipient-view/fields/RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldNumber } from "../recipient-view/fields/RecipientViewPetitionFieldNumber";
import { RecipientViewPetitionFieldPhone } from "../recipient-view/fields/RecipientViewPetitionFieldPhone";
import { RecipientViewPetitionFieldSelect } from "../recipient-view/fields/RecipientViewPetitionFieldSelect";
import { RecipientViewPetitionFieldShortText } from "../recipient-view/fields/RecipientViewPetitionFieldShortText";
import { RecipientViewPetitionFieldTaxDocuments } from "../recipient-view/fields/RecipientViewPetitionFieldTaxDocuments";
import { RecipientViewPetitionFieldText } from "../recipient-view/fields/RecipientViewPetitionFieldText";
import {
  useCreateFileUploadReply,
  useCreatePetitionFieldReply,
  useDeletePetitionReply,
  useStartAsyncFieldCompletion,
  useUpdatePetitionFieldReply,
} from "./clientMutations";
import { PreviewPetitionFieldGroup } from "./fields/PreviewPetitionFieldGroup";
import { PreviewPetitionFieldKyc } from "./fields/PreviewPetitionFieldKyc";
import { PreviewPetitionFieldBackgroundCheck } from "./fields/background-check/PreviewPetitionFieldBackgroundCheck";
import { RecipientViewPetitionFieldIdVerification } from "../recipient-view/fields/RecipientViewPetitionFieldIdVerification";
import { useHasIdVerification } from "@parallel/utils/useHasIdVerification";

export interface PreviewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "onDownloadAttachment" | "field"
  > {
  user: PreviewPetitionField_UserFragment;
  petition: PreviewPetitionField_PetitionBaseFragment;
  field: PreviewPetitionField_PetitionFieldFragment;
  isDisabled: boolean;
  isCacheOnly: boolean;
  myEffectivePermission: PetitionPermissionType;
  showErrors: boolean;
  fieldLogic: FieldLogicResult;
  onError: (error: any) => void;
}

export function PreviewPetitionField({
  user,
  field,
  petition,
  isCacheOnly,
  isDisabled,
  myEffectivePermission,
  showErrors,
  fieldLogic,
  onCommentsButtonClick,
  ...props
}: PreviewPetitionFieldProps) {
  const petitionId = petition.id;
  const uploads = useRef<Record<string, AbortController>>({});
  const fieldId = field.id;

  const hasIdVerificationFeature = useHasIdVerification();

  useEffect(() => {
    if (
      isCacheOnly &&
      field.type === "FIELD_GROUP" &&
      !field.optional &&
      field.previewReplies.length === 0
    ) {
      handleCreatePetitionFieldReply({}, field.id);
    }
  }, []);

  const [petitionFieldAttachmentDownloadLink] = useMutation(
    PreviewPetitionField_petitionFieldAttachmentDownloadLinkDocument,
  );
  const handleDownloadAttachment = useMemoFactory(
    (fieldId: string) => async (attachmentId: string) => {
      await withError(
        openNewWindow(async () => {
          const { data } = await petitionFieldAttachmentDownloadLink({
            variables: {
              petitionId,
              fieldId,
              attachmentId,
            },
          });
          const { url } = data!.petitionFieldAttachmentDownloadLink;
          return url!;
        }),
      );
    },
    [petitionId],
  );

  const deletePetitionReply = useDeletePetitionReply();
  const handleDeletePetitionReply = useCallback(
    async (replyId: string, _fieldId?: string, parentReplyId?: string) => {
      try {
        if (replyId in uploads.current) {
          uploads.current[replyId].abort();
          delete uploads.current[replyId];
        }
        await deletePetitionReply({
          petitionId,
          fieldId: _fieldId ?? fieldId,
          replyId,
          parentReplyId,
          isCacheOnly,
        });
      } catch (e) {
        props.onError(e);
      }
    },
    [deletePetitionReply],
  );

  const updatePetitionFieldReply = useUpdatePetitionFieldReply();
  const handleUpdatePetitionFieldReply = useCallback(
    async (replyId: string, content: any, _fieldId?: string) => {
      await updatePetitionFieldReply({
        petitionId,
        fieldId: _fieldId ?? fieldId,
        replyId,
        content,
        isCacheOnly,
      });
    },
    [updatePetitionFieldReply],
  );

  const createPetitionFieldReply = useCreatePetitionFieldReply();
  const handleCreatePetitionFieldReply = useCallback(
    async (content: any, _fieldId?: string, parentReplyId?: string) => {
      const res = await createPetitionFieldReply({
        petitionId,
        fieldId: _fieldId ?? fieldId,
        content,
        parentReplyId,
        isCacheOnly,
      });
      return res?.id;
    },
    [createPetitionFieldReply],
  );

  const createFileUploadReply = useCreateFileUploadReply();
  const handleCreateFileUploadReply = useCallback(
    async (content: File[], _fieldId?: string, parentReplyId?: string) => {
      await createFileUploadReply({
        petitionId,
        fieldId: _fieldId ?? fieldId,
        content,
        uploads,
        parentReplyId,
        isCacheOnly,
      });
    },
    [createFileUploadReply],
  );

  const [downloadFileUploadReply] = useMutation(
    RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkDocument,
  );
  const showFailure = useFailureGeneratingLinkDialog();
  const apollo = useApolloClient();
  const handleDownloadFileUploadReply = useCallback(
    async (replyId: string) => {
      try {
        if (isCacheOnly) return;
        openNewWindow(async () => {
          const reply = apollo.cache.readFragment({
            fragment: PreviewPetitionField_PetitionFieldReplyFragmentDoc,
          });
          const { data } = await downloadFileUploadReply({
            variables: {
              petitionId,
              replyId,
              preview: false,
            },
          });
          const { url, result } = data!.fileUploadReplyDownloadLink;
          if (result !== "SUCCESS") {
            await withError(showFailure({ filename: reply!.content.filename }));
            throw new Error();
          }
          return url!;
        });
      } catch {}
    },
    [downloadFileUploadReply],
  );

  const startAsyncFieldCompletion = useStartAsyncFieldCompletion();

  const handleStartAsyncFieldCompletion = async (_fieldId?: string, parentReplyId?: string) => {
    return await startAsyncFieldCompletion({
      fieldId: _fieldId ?? fieldId,
      petitionId,
      parentReplyId,
      isCacheOnly,
    });
  };

  const [retryAsyncFieldCompletion] = useMutation(
    PreviewPetitionField_retryAsyncFieldCompletionDocument,
  );
  const handleRetryAsyncFieldCompletion = async (_fieldId?: string, parentReplyId?: string) => {
    const { data } = await retryAsyncFieldCompletion({
      variables: {
        petitionId,
        fieldId: _fieldId ?? fieldId,
        parentReplyId,
      },
    });
    return pick(data!.retryAsyncFieldCompletion, ["type", "url"]);
  };

  const { refetch } = useQuery(PreviewPetitionField_queryDocument, {
    skip: true,
  });
  const handleRefreshAsyncField = useCallback(async () => {
    await refetch({ fieldId: field.id, petitionId });
  }, [refetch, field.id, petitionId]);

  const fieldIsDisabled = isDisabled || myEffectivePermission === "READ";

  const commonProps = {
    field: { ...field, replies: isCacheOnly ? field.previewReplies : field.replies },
    onCommentsButtonClick: onCommentsButtonClick,
    onDownloadAttachment: handleDownloadAttachment(field.id),
    onDeleteReply: handleDeletePetitionReply,
    onUpdateReply: handleUpdatePetitionFieldReply,
    onCreateReply: handleCreatePetitionFieldReply,
    isDisabled: fieldIsDisabled,
  };

  if (field.type === "HEADING") {
    return (
      <RecipientViewPetitionFieldHeading
        field={field}
        onDownloadAttachment={handleDownloadAttachment(field.id)}
        onCommentsButtonClick={onCommentsButtonClick}
      />
    );
  } else if (field.type === "FIELD_GROUP") {
    return (
      <PreviewPetitionFieldGroup
        {...props}
        {...commonProps}
        user={user}
        onDownloadAttachment={handleDownloadAttachment}
        onCreateFileReply={handleCreateFileUploadReply}
        onDownloadFileUploadReply={handleDownloadFileUploadReply}
        onRefreshField={handleRefreshAsyncField}
        onStartAsyncFieldCompletion={handleStartAsyncFieldCompletion}
        onRetryAsyncFieldCompletion={handleRetryAsyncFieldCompletion}
        isCacheOnly={isCacheOnly}
        petition={petition}
        showErrors={showErrors}
        fieldLogic={fieldLogic}
      />
    );
  }

  return (
    <RecipientViewPetitionFieldCard field={field}>
      {field.type === "TEXT" ? (
        <RecipientViewPetitionFieldText {...props} {...commonProps} />
      ) : field.type === "SHORT_TEXT" ? (
        <RecipientViewPetitionFieldShortText {...props} {...commonProps} />
      ) : field.type === "SELECT" ? (
        <RecipientViewPetitionFieldSelect {...props} {...commonProps} />
      ) : field.type === "FILE_UPLOAD" ? (
        <RecipientViewPetitionFieldFileUpload
          {...props}
          {...commonProps}
          onCreateReply={handleCreateFileUploadReply}
          onDownloadReply={handleDownloadFileUploadReply}
          isCacheOnly={isCacheOnly}
        />
      ) : field.type === "DYNAMIC_SELECT" ? (
        <RecipientViewPetitionFieldDynamicSelect {...props} {...commonProps} />
      ) : field.type === "CHECKBOX" ? (
        <RecipientViewPetitionFieldCheckbox {...props} {...commonProps} />
      ) : field.type === "NUMBER" ? (
        <RecipientViewPetitionFieldNumber {...props} {...commonProps} />
      ) : field.type === "DATE" ? (
        <RecipientViewPetitionFieldDate {...props} {...commonProps} />
      ) : field.type === "DATE_TIME" ? (
        <RecipientViewPetitionFieldDateTime {...props} {...commonProps} />
      ) : field.type === "PHONE" ? (
        <RecipientViewPetitionFieldPhone {...props} {...commonProps} />
      ) : field.type === "ES_TAX_DOCUMENTS" ? (
        <RecipientViewPetitionFieldTaxDocuments
          {...props}
          {...commonProps}
          onDownloadReply={handleDownloadFileUploadReply}
          onStartAsyncFieldCompletion={handleStartAsyncFieldCompletion}
          onRetryAsyncFieldCompletion={handleRetryAsyncFieldCompletion}
          onRefreshField={handleRefreshAsyncField}
          isCacheOnly={isCacheOnly}
        />
      ) : field.type === "DOW_JONES_KYC" ? (
        <PreviewPetitionFieldKyc
          {...props}
          {...commonProps}
          petition={petition}
          onDownloadReply={handleDownloadFileUploadReply}
          onRefreshField={handleRefreshAsyncField}
          isCacheOnly={isCacheOnly}
        />
      ) : field.type === "BACKGROUND_CHECK" ? (
        <PreviewPetitionFieldBackgroundCheck
          {...props}
          {...commonProps}
          user={user}
          petition={petition}
          onRefreshField={handleRefreshAsyncField}
          isCacheOnly={isCacheOnly}
        />
      ) : field.type === "ID_VERIFICATION" ? (
        <RecipientViewPetitionFieldIdVerification
          {...props}
          {...commonProps}
          isDisabled={fieldIsDisabled}
          onStartAsyncFieldCompletion={handleStartAsyncFieldCompletion}
          onRefreshField={handleRefreshAsyncField}
          isCacheOnly={isCacheOnly}
          hasIdVerificationFeature={hasIdVerificationFeature}
        />
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
}

PreviewPetitionField.fragments = {
  User: gql`
    fragment PreviewPetitionField_User on User {
      id
      ...PreviewPetitionFieldBackgroundCheck_User
      ...PreviewPetitionFieldGroup_User
    }
    ${PreviewPetitionFieldBackgroundCheck.fragments.User}
    ${PreviewPetitionFieldGroup.fragments.User}
  `,
  PetitionBase: gql`
    fragment PreviewPetitionField_PetitionBase on PetitionBase {
      ...PreviewPetitionFieldBackgroundCheck_PetitionBase
      ...PreviewPetitionFieldKyc_PetitionBase
      ...PreviewPetitionFieldGroup_PetitionBase
    }
    ${PreviewPetitionFieldBackgroundCheck.fragments.PetitionBase}
    ${PreviewPetitionFieldKyc.fragments.PetitionBase}
    ${PreviewPetitionFieldGroup.fragments.PetitionBase}
  `,
  PetitionField: gql`
    fragment PreviewPetitionField_PetitionField on PetitionField {
      ...RecipientViewPetitionFieldLayout_PetitionField
      ...RecipientViewPetitionFieldCard_PetitionField
      ...PreviewPetitionFieldGroup_PetitionField
      replies {
        ...RecipientViewPetitionFieldLayout_PetitionFieldReply
      }
      previewReplies @client {
        ...RecipientViewPetitionFieldLayout_PetitionFieldReply
      }
      parent {
        id
      }
      ...completedFieldReplies_PetitionField
    }
    ${RecipientViewPetitionFieldCard.fragments.PetitionField}
    ${RecipientViewPetitionFieldLayout.fragments.PetitionField}
    ${RecipientViewPetitionFieldLayout.fragments.PetitionFieldReply}
    ${PreviewPetitionFieldGroup.fragments.PetitionField}
    ${completedFieldReplies.fragments.PetitionField}
  `,
  PetitionFieldReply: gql`
    fragment PreviewPetitionField_PetitionFieldReply on PetitionFieldReply {
      content
    }
  `,
};

const _queries = [
  gql`
    query PreviewPetitionField_query($petitionId: GID!, $fieldId: GID!) {
      petitionField(petitionId: $petitionId, petitionFieldId: $fieldId) {
        ...PreviewPetitionField_PetitionField
      }
    }
    ${PreviewPetitionField.fragments.PetitionField}
  `,
];

PreviewPetitionField.mutations = [
  gql`
    mutation PreviewPetitionField_petitionFieldAttachmentDownloadLink(
      $petitionId: GID!
      $fieldId: GID!
      $attachmentId: GID!
    ) {
      petitionFieldAttachmentDownloadLink(
        petitionId: $petitionId
        fieldId: $fieldId
        attachmentId: $attachmentId
      ) {
        url
      }
    }
  `,
  gql`
    mutation PreviewPetitionField_retryAsyncFieldCompletion(
      $fieldId: GID!
      $petitionId: GID!
      $parentReplyId: GID
    ) {
      retryAsyncFieldCompletion(
        petitionId: $petitionId
        parentReplyId: $parentReplyId
        fieldId: $fieldId
      ) {
        type
        url
      }
    }
  `,
];
