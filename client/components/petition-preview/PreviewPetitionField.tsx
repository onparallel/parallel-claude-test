import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
  PetitionPermissionType,
  PreviewPetitionField_PetitionBaseFragment,
  PreviewPetitionField_PetitionFieldDocument,
  PreviewPetitionField_PetitionFieldFragment,
  PreviewPetitionField_PetitionFieldReplyFragmentDoc,
  PreviewPetitionField_petitionFieldAttachmentDownloadLinkDocument,
  RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkDocument,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useCallback, useEffect, useRef } from "react";
import { useTone } from "../common/ToneProvider";
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
import {
  PreviewPetitionFieldCommentsDialog,
  usePreviewPetitionFieldCommentsDialog,
} from "./dialogs/PreviewPetitionFieldCommentsDialog";
import { PreviewPetitionFieldGroup } from "./fields/PreviewPetitionFieldGroup";
import { PreviewPetitionFieldKyc } from "./fields/PreviewPetitionFieldKyc";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/useFieldLogic";

export interface PreviewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "onDownloadAttachment" | "field"
  > {
  petition: PreviewPetitionField_PetitionBaseFragment;
  field: PreviewPetitionField_PetitionFieldFragment;
  isDisabled: boolean;
  isCacheOnly: boolean;
  myEffectivePermission: PetitionPermissionType;
  showErrors: boolean;
  fieldLogic: FieldLogicResult;
}

export function PreviewPetitionField({
  field,
  petition,
  isCacheOnly,
  isDisabled,
  myEffectivePermission,
  showErrors,
  fieldLogic,
  ...props
}: PreviewPetitionFieldProps) {
  const petitionId = petition.id;
  const uploads = useRef<Record<string, AbortController>>({});
  const fieldId = field.id;
  const tone = useTone();

  const isInvalid = showErrors && !field.optional && completedFieldReplies(field).length === 0;

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
  const handleDownloadAttachment = async function (attachmentId: string) {
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
  };

  const showFieldComments = usePreviewPetitionFieldCommentsDialog();
  async function handleCommentsButtonClick() {
    try {
      await showFieldComments({
        petitionId,
        field,
        isTemplate: isCacheOnly,
        isDisabled,
        tone,
        onlyReadPermission: myEffectivePermission === "READ",
      });
    } catch {}
  }

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
      } catch {}
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
      try {
        await createFileUploadReply({
          petitionId,
          fieldId: _fieldId ?? fieldId,
          content,
          uploads,
          parentReplyId,
          isCacheOnly,
        });
      } catch {}
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

  const { refetch } = useQuery(PreviewPetitionField_PetitionFieldDocument, {
    skip: true,
  });
  const handleRefreshAsyncField = useCallback(async () => {
    await refetch({ fieldId: field.id, petitionId });
  }, [refetch, field.id, petitionId]);

  const fieldIsDisabled = isDisabled || myEffectivePermission === "READ";

  const commonProps = {
    field: { ...field, replies: isCacheOnly ? field.previewReplies : field.replies },
    onCommentsButtonClick: handleCommentsButtonClick,
    onDownloadAttachment: handleDownloadAttachment,
    onDeleteReply: handleDeletePetitionReply,
    onUpdateReply: handleUpdatePetitionFieldReply,
    onCreateReply: handleCreatePetitionFieldReply,
    isDisabled: fieldIsDisabled,
  };

  if (field.type === "HEADING") {
    return (
      <RecipientViewPetitionFieldHeading
        field={field}
        onDownloadAttachment={handleDownloadAttachment}
        onCommentsButtonClick={handleCommentsButtonClick}
      />
    );
  } else if (field.type === "FIELD_GROUP") {
    return (
      <PreviewPetitionFieldGroup
        {...props}
        {...commonProps}
        onCreateFileReply={handleCreateFileUploadReply}
        onDownloadFileUploadReply={handleDownloadFileUploadReply}
        onRefreshField={handleRefreshAsyncField}
        onStartAsyncFieldCompletion={handleStartAsyncFieldCompletion}
        isCacheOnly={isCacheOnly}
        petition={petition}
        showErrors={showErrors}
        fieldLogic={fieldLogic}
      />
    );
  }

  return (
    <RecipientViewPetitionFieldCard isInvalid={isInvalid} field={field}>
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
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
}

PreviewPetitionField.fragments = {
  PetitionBase: gql`
    fragment PreviewPetitionField_PetitionBase on PetitionBase {
      ...PreviewPetitionFieldKyc_PetitionBase
      ...PreviewPetitionFieldGroup_PetitionBase
    }
    ${PreviewPetitionFieldKyc.fragments.PetitionBase}
    ${PreviewPetitionFieldGroup.fragments.PetitionBase}
  `,
  PetitionField: gql`
    fragment PreviewPetitionField_PetitionField on PetitionField {
      ...RecipientViewPetitionFieldLayout_PetitionField
      ...RecipientViewPetitionFieldCard_PetitionField
      ...PreviewPetitionFieldCommentsDialog_PetitionField
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
    ${PreviewPetitionFieldCommentsDialog.fragments.PetitionField}
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
    query PreviewPetitionField_PetitionField($petitionId: GID!, $fieldId: GID!) {
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
];
