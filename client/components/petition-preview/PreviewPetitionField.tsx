import { gql, useApolloClient, useMutation } from "@apollo/client";
import {
  PreviewPetitionField_petitionFieldAttachmentDownloadLinkDocument,
  PreviewPetitionField_PetitionFieldFragment,
  PreviewPetitionField_PetitionFieldReplyFragmentDoc,
  RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkDocument,
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
import {
  CheckboxValue,
  RecipientViewPetitionFieldCheckbox,
} from "../recipient-view/fields/RecipientViewPetitionFieldCheckbox";
import { RecipientViewPetitionFieldDate } from "../recipient-view/fields/RecipientViewPetitionFieldDate";
import {
  DynamicSelectValue,
  RecipientViewPetitionFieldDynamicSelect,
} from "../recipient-view/fields/RecipientViewPetitionFieldDynamicSelect";
import { RecipientViewPetitionFieldFileUpload } from "../recipient-view/fields/RecipientViewPetitionFieldFileUpload";
import { RecipientViewPetitionFieldHeading } from "../recipient-view/fields/RecipientViewPetitionFieldHeading";
import { RecipientViewPetitionFieldNumber } from "../recipient-view/fields/RecipientViewPetitionFieldNumber";
import { RecipientViewPetitionFieldSelect } from "../recipient-view/fields/RecipientViewPetitionFieldSelect";
import { RecipientViewPetitionFieldText } from "../recipient-view/fields/RecipientViewPetitionFieldText";
import {
  useCreateCheckboxReply,
  useCreateDynamicSelectReply,
  useCreateFileUploadReply,
  useCreateNumericReply,
  useCreateSimpleReply,
  useDeletePetitionReply,
  useUpdateCheckboxReply,
  useUpdateDynamicSelectReply,
  useUpdateNumericReply,
  useUpdateSimpleReply,
} from "./clientMutations";
import { usePreviewPetitionFieldCommentsDialog } from "./dialogs/PreviewPetitionFieldCommentsDialog";

export interface PreviewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "onDownloadAttachment" | "field"
  > {
  field: PreviewPetitionField_PetitionFieldFragment;
  petitionId: string;
  isDisabled: boolean;
  isCacheOnly: boolean;
}

export function PreviewPetitionField({
  field,
  petitionId,
  isCacheOnly,
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

  const updateSimpleReply = useUpdateSimpleReply();
  const handleUpdateSimpleReply = useCallback(
    async (replyId: string, reply: string) => {
      try {
        await updateSimpleReply({
          petitionId,
          replyId,
          reply,
          isCacheOnly,
        });
      } catch {}
    },
    [updateSimpleReply]
  );

  const createSimpleReply = useCreateSimpleReply();
  const handleCreateSimpleReply = useCallback(
    async (reply: string) => {
      try {
        const res = await createSimpleReply({
          petitionId,
          fieldId,
          reply,
          isCacheOnly,
        });
        return res?.id;
      } catch {}

      return;
    },
    [createSimpleReply]
  );

  const updateNumericReply = useUpdateNumericReply();
  const handleUpdateNumericReply = useCallback(
    async (replyId: string, reply: number) => {
      try {
        await updateNumericReply({
          petitionId,
          replyId,
          reply,
          isCacheOnly,
        });
      } catch {}
    },
    [updateNumericReply]
  );

  const createNumericReply = useCreateNumericReply();
  const handleCreateNumericReply = useCallback(
    async (reply: number) => {
      try {
        const res = await createNumericReply({
          petitionId,
          fieldId,
          reply,
          isCacheOnly,
        });
        return res?.id;
      } catch {}

      return;
    },
    [createNumericReply]
  );

  const updateCheckboxReply = useUpdateCheckboxReply();
  const handleUpdateCheckboxReply = useCallback(
    async (replyId: string, values: string[]) => {
      try {
        await updateCheckboxReply({
          petitionId,
          replyId,
          values,
          isCacheOnly,
        });
      } catch {}
    },
    [updateCheckboxReply]
  );

  const createCheckboxReply = useCreateCheckboxReply();
  const handleCreateCheckboxReply = useCallback(
    async (values: CheckboxValue) => {
      try {
        await createCheckboxReply({
          petitionId,
          fieldId,
          values,
          isCacheOnly,
        });
      } catch {}
    },
    [createCheckboxReply]
  );

  const updateDynamicSelectReply = useUpdateDynamicSelectReply();
  const handleUpdateDynamicSelectReply = useCallback(
    async (replyId: string, value: DynamicSelectValue) => {
      await updateDynamicSelectReply({
        petitionId,
        replyId,
        value,
        isCacheOnly,
      });
    },
    [updateDynamicSelectReply]
  );

  const createDynamicSelectReply = useCreateDynamicSelectReply();
  const handleCreateDynamicSelectReply = useCallback(
    async (value: DynamicSelectValue) => {
      try {
        const reply = await createDynamicSelectReply({
          petitionId,
          fieldId,
          value,
          isCacheOnly,
        });

        return reply?.id;
      } catch {}
    },
    [createDynamicSelectReply]
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

  const commonProps = {
    field: { ...field, replies: isCacheOnly ? field.previewReplies : field.replies },
    petitionId,
    onCommentsButtonClick: handleCommentsButtonClick,
    onDownloadAttachment: handleDownloadAttachment,
  };

  return field.type === "HEADING" ? (
    <RecipientViewPetitionFieldHeading {...props} {...commonProps} />
  ) : field.type === "TEXT" || field.type === "SHORT_TEXT" ? (
    <RecipientViewPetitionFieldText
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateSimpleReply}
      onCreateReply={handleCreateSimpleReply}
    />
  ) : field.type === "SELECT" ? (
    <RecipientViewPetitionFieldSelect
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateSimpleReply}
      onCreateReply={handleCreateSimpleReply}
    />
  ) : field.type === "FILE_UPLOAD" ? (
    <RecipientViewPetitionFieldFileUpload
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onCreateReply={handleCreateFileUploadReply}
      onDownloadReply={handleDownloadFileUploadReply}
      isCacheOnly={isCacheOnly}
    />
  ) : field.type === "DYNAMIC_SELECT" ? (
    <RecipientViewPetitionFieldDynamicSelect
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateDynamicSelectReply}
      onCreateReply={handleCreateDynamicSelectReply}
    />
  ) : field.type === "CHECKBOX" ? (
    <RecipientViewPetitionFieldCheckbox
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateCheckboxReply}
      onCreateReply={handleCreateCheckboxReply}
    />
  ) : field.type === "NUMBER" ? (
    <RecipientViewPetitionFieldNumber
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateNumericReply}
      onCreateReply={handleCreateNumericReply}
    />
  ) : field.type === "DATE" ? (
    <RecipientViewPetitionFieldDate
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateSimpleReply}
      onCreateReply={handleCreateSimpleReply}
    />
  ) : null;
}

PreviewPetitionField.fragments = {
  PetitionField: gql`
    fragment PreviewPetitionField_PetitionField on PetitionField {
      ...RecipientViewPetitionFieldCard_PetitionField
      previewReplies @client {
        ...RecipientViewPetitionFieldCard_PetitionFieldReply
      }
    }
    ${RecipientViewPetitionFieldCard.fragments.PetitionField}
    ${RecipientViewPetitionFieldCard.fragments.PetitionFieldReply}
  `,
  PetitionFieldReply: gql`
    fragment PreviewPetitionField_PetitionFieldReply on PetitionFieldReply {
      content
    }
  `,
};

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
