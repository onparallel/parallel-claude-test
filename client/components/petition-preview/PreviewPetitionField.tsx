import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
  PreviewPetitionField_petitionFieldAttachmentDownloadLinkDocument,
  PreviewPetitionField_PetitionFieldDocument,
  PreviewPetitionField_PetitionFieldFragment,
  PreviewPetitionField_PetitionFieldReplyFragmentDoc,
  RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkDocument,
  Tone,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useCallback, useRef } from "react";
import { useFailureGeneratingLinkDialog } from "../petition-replies/dialogs/FailureGeneratingLinkDialog";
import { UploadCache } from "../recipient-view/fields/RecipientViewPetitionField";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "../recipient-view/fields/RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldCheckbox } from "../recipient-view/fields/RecipientViewPetitionFieldCheckbox";
import { RecipientViewPetitionFieldDate } from "../recipient-view/fields/RecipientViewPetitionFieldDate";
import { RecipientViewPetitionFieldDynamicSelect } from "../recipient-view/fields/RecipientViewPetitionFieldDynamicSelect";
import { RecipientViewPetitionFieldFileUpload } from "../recipient-view/fields/RecipientViewPetitionFieldFileUpload";
import { RecipientViewPetitionFieldHeading } from "../recipient-view/fields/RecipientViewPetitionFieldHeading";
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

export interface PreviewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "onDownloadAttachment" | "field"
  > {
  field: PreviewPetitionField_PetitionFieldFragment;
  petitionId: string;
  isDisabled: boolean;
  isCacheOnly: boolean;
  tone: Tone;
}

export function PreviewPetitionField({
  field,
  petitionId,
  isCacheOnly,
  tone,
  ...props
}: PreviewPetitionFieldProps) {
  const uploads = useRef<UploadCache>({});
  const fieldId = field.id;

  const [petitionFieldAttachmentDownloadLink] = useMutation(
    PreviewPetitionField_petitionFieldAttachmentDownloadLinkDocument
  );
  const handleDownloadAttachment = function (attachmentId: string) {
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
    });
  };

  const showFieldComments = usePreviewPetitionFieldCommentsDialog();
  async function handleCommentsButtonClick() {
    try {
      await showFieldComments({
        petitionId,
        field,
        isTemplate: isCacheOnly,
        tone,
      });
    } catch {}
  }

  const deletePetitionReply = useDeletePetitionReply();
  const handleDeletePetitionReply = useCallback(
    async (replyId: string) => {
      try {
        if (replyId in uploads.current) {
          uploads.current[replyId].abort();
          delete uploads.current[replyId];
        }
        await deletePetitionReply({
          petitionId,
          fieldId,
          replyId,
          isCacheOnly,
        });
      } catch {}
    },
    [deletePetitionReply]
  );

  const updatePetitionFieldReply = useUpdatePetitionFieldReply();
  const handleUpdatePetitionFieldReply = useCallback(
    async (replyId: string, reply: any) => {
      try {
        await updatePetitionFieldReply({
          petitionId,
          replyId,
          reply,
          isCacheOnly,
        });
      } catch {}
    },
    [updatePetitionFieldReply]
  );

  const createPetitionFieldReply = useCreatePetitionFieldReply();
  const handleCreatePetitionFieldReply = useCallback(
    async (reply: any) => {
      try {
        const res = await createPetitionFieldReply({
          petitionId,
          fieldId,
          reply,
          isCacheOnly,
        });
        return res?.id;
      } catch {}

      return;
    },
    [createPetitionFieldReply]
  );

  const createFileUploadReply = useCreateFileUploadReply();
  const handleCreateFileUploadReply = useCallback(
    async (content: File[]) => {
      try {
        await createFileUploadReply({
          petitionId,
          fieldId,
          content,
          uploads,
          isCacheOnly,
        });
      } catch {}
    },
    [createFileUploadReply]
  );

  const [downloadFileUploadReply] = useMutation(
    RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkDocument
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
    [downloadFileUploadReply]
  );

  const startAsyncFieldCompletion = useStartAsyncFieldCompletion();

  const handleStartAsyncFieldCompletion = async () => {
    return await startAsyncFieldCompletion({
      fieldId: field.id,
      petitionId,
      isCacheOnly,
    });
  };

  const { refetch } = useQuery(PreviewPetitionField_PetitionFieldDocument, {
    skip: true,
  });
  const handleRefreshAsyncField = useCallback(
    async () => await refetch({ fieldId: field.id, petitionId }),
    [refetch, field.id, petitionId]
  );

  const commonProps = {
    field: { ...field, replies: isCacheOnly ? field.previewReplies : field.replies },
    petitionId,
    onCommentsButtonClick: handleCommentsButtonClick,
    onDownloadAttachment: handleDownloadAttachment,
    onDeleteReply: handleDeletePetitionReply,
    onUpdateReply: handleUpdatePetitionFieldReply,
    onCreateReply: handleCreatePetitionFieldReply,
  };

  return field.type === "HEADING" ? (
    <RecipientViewPetitionFieldHeading {...props} {...commonProps} />
  ) : field.type === "TEXT" ? (
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
  ) : field.type === "PHONE" ? (
    <RecipientViewPetitionFieldPhone {...props} {...commonProps} />
  ) : field.type === "ES_TAX_DOCUMENTS" ? (
    <RecipientViewPetitionFieldTaxDocuments
      {...props}
      {...commonProps}
      tone={tone}
      onDownloadReply={handleDownloadFileUploadReply}
      onStartAsyncFieldCompletion={handleStartAsyncFieldCompletion}
      onRefreshField={handleRefreshAsyncField}
      isCacheOnly={isCacheOnly}
      view="preview"
    />
  ) : null;
}

PreviewPetitionField.fragments = {
  PetitionField: gql`
    fragment PreviewPetitionField_PetitionField on PetitionField {
      ...RecipientViewPetitionFieldCard_PetitionField
      ...PreviewPetitionFieldCommentsDialog_PetitionField
      previewReplies @client {
        ...RecipientViewPetitionFieldCard_PetitionFieldReply
      }
    }
    ${RecipientViewPetitionFieldCard.fragments.PetitionField}
    ${RecipientViewPetitionFieldCard.fragments.PetitionFieldReply}
    ${PreviewPetitionFieldCommentsDialog.fragments.PetitionField}
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
