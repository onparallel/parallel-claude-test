import { gql, useApolloClient, useMutation } from "@apollo/client";
import {
  PreviewPetitionField_petitionFieldAttachmentDownloadLinkDocument,
  PreviewPetitionField_PetitionFieldReplyFragmentDoc,
  RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkDocument,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useCallback, useRef } from "react";
import { useFailureGeneratingLinkDialog } from "../petition-replies/dialogs/FailureGeneratingLinkDialog";
import { usePetitionFieldCommentsDialog } from "../recipient-view/dialogs/RecipientViewPetitionFieldCommentsDialog";
import { UploadCache } from "../recipient-view/fields/RecipientViewPetitionField";
import { RecipientViewPetitionFieldCardProps } from "../recipient-view/fields/RecipientViewPetitionFieldCard";
import {
  CheckboxValue,
  RecipientViewPetitionFieldCheckbox,
} from "../recipient-view/fields/RecipientViewPetitionFieldCheckbox";
import {
  DynamicSelectValue,
  RecipientViewPetitionFieldDynamicSelect,
} from "../recipient-view/fields/RecipientViewPetitionFieldDynamicSelect";
import { RecipientViewPetitionFieldFileUpload } from "../recipient-view/fields/RecipientViewPetitionFieldFileUpload";
import { RecipientViewPetitionFieldHeading } from "../recipient-view/fields/RecipientViewPetitionFieldHeading";
import { RecipientViewPetitionFieldSelect } from "../recipient-view/fields/RecipientViewPetitionFieldSelect";
import { RecipientViewPetitionFieldText } from "../recipient-view/fields/RecipientViewPetitionFieldText";
import {
  useCreateCheckboxReply,
  useCreateDynamicSelectReply,
  useCreateFileUploadReply,
  useCreateSimpleReply,
  useDeletePetitionReply,
  useUpdateCheckboxReply,
  useUpdateDynamicSelectReply,
  useUpdateSimpleReply,
} from "./mutations";

export interface PreviewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "onDownloadAttachment"
  > {
  petitionId: string;
  isDisabled: boolean;
  isCacheOnly: boolean;
}

export function PreviewPetitionField(props: PreviewPetitionFieldProps) {
  const uploads = useRef<UploadCache>({});

  const [petitionFieldAttachmentDownloadLink] = useMutation(
    PreviewPetitionField_petitionFieldAttachmentDownloadLinkDocument
  );
  const handleDownloadAttachment = function (attachmentId: string) {
    openNewWindow(async () => {
      const { data } = await petitionFieldAttachmentDownloadLink({
        variables: {
          petitionId: props.petitionId,
          fieldId: props.field.id,
          attachmentId,
        },
      });
      const { url } = data!.petitionFieldAttachmentDownloadLink;
      return url!;
    });
  };

  const showFieldComments = usePetitionFieldCommentsDialog();
  async function handleCommentsButtonClick() {
    try {
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
          petitionId: props.petitionId,
          fieldId: props.field.id,
          replyId,
          isCacheOnly: props.isCacheOnly,
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
          petitionId: props.petitionId,
          replyId,
          reply,
          isCacheOnly: props.isCacheOnly,
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
          petitionId: props.petitionId,
          fieldId: props.field.id,
          reply,
          isCacheOnly: props.isCacheOnly,
        });
        return res?.id;
      } catch {}

      return;
    },
    [createSimpleReply]
  );

  const updateCheckboxReply = useUpdateCheckboxReply();
  const handleUpdateCheckboxReply = useCallback(
    async (replyId: string, values: string[]) => {
      try {
        await updateCheckboxReply({
          petitionId: props.petitionId,
          replyId,
          values,
        });
      } catch {}
    },
    [updateCheckboxReply]
  );

  const createChekcboxReply = useCreateCheckboxReply();
  const handleCreateCheckboxReply = useCallback(
    async (values: CheckboxValue) => {
      try {
        await createChekcboxReply({
          petitionId: props.petitionId,
          fieldId: props.field.id,
          values,
        });
      } catch {}
    },
    [createChekcboxReply]
  );

  const updateDynamicSelectReply = useUpdateDynamicSelectReply();
  const handleUpdateDynamicSelectReply = useCallback(
    async (replyId: string, value: DynamicSelectValue) => {
      await updateDynamicSelectReply({
        petitionId: props.petitionId,
        replyId,
        value,
      });
    },
    [updateDynamicSelectReply]
  );

  const createDynamicSelectReply = useCreateDynamicSelectReply();
  const handleCreateDynamicSelectReply = useCallback(
    async (value: DynamicSelectValue) => {
      try {
        const reply = await createDynamicSelectReply({
          petitionId: props.petitionId,
          fieldId: props.field.id,
          value,
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
        createFileUploadReply({
          petitionId: props.petitionId,
          fieldId: props.field.id,
          content,
          uploads,
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
  const handleDonwloadFileUploadReply = useCallback(
    async (replyId: string) => {
      try {
        openNewWindow(async () => {
          const reply = apollo.cache.readFragment({
            fragment: PreviewPetitionField_PetitionFieldReplyFragmentDoc,
          });
          const { data } = await downloadFileUploadReply({
            variables: {
              petitionId: props.petitionId,
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
    onCommentsButtonClick: handleCommentsButtonClick,
    onDownloadAttachment: handleDownloadAttachment,
  };

  return props.field.type === "HEADING" ? (
    <RecipientViewPetitionFieldHeading {...props} {...commonProps} />
  ) : props.field.type === "TEXT" || props.field.type === "SHORT_TEXT" ? (
    <RecipientViewPetitionFieldText
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateSimpleReply}
      onCreateReply={handleCreateSimpleReply}
    />
  ) : props.field.type === "SELECT" ? (
    <RecipientViewPetitionFieldSelect
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateSimpleReply}
      onCreateReply={handleCreateSimpleReply}
    />
  ) : props.field.type === "FILE_UPLOAD" ? (
    <RecipientViewPetitionFieldFileUpload
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onCreateReply={handleCreateFileUploadReply}
      onDownloadReply={handleDonwloadFileUploadReply}
    />
  ) : props.field.type === "DYNAMIC_SELECT" ? (
    <RecipientViewPetitionFieldDynamicSelect
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateDynamicSelectReply}
      onCreateReply={handleCreateDynamicSelectReply}
    />
  ) : props.field.type === "CHECKBOX" ? (
    <RecipientViewPetitionFieldCheckbox
      {...props}
      {...commonProps}
      onDeleteReply={handleDeletePetitionReply}
      onUpdateReply={handleUpdateCheckboxReply}
      onCreateReply={handleCreateCheckboxReply}
    />
  ) : null;
}

PreviewPetitionField.fragments = {
  PublicPetitionFieldReply: gql`
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
