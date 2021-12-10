import { gql, useMutation } from "@apollo/client";
import {
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment,
  RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument,
  RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { MutableRefObject } from "react";
import {
  RecipientViewPetitionFieldCommentsDialog,
  usePetitionFieldCommentsDialog,
} from "../dialogs/RecipientViewPetitionFieldCommentsDialog";
import { useLastSaved } from "../LastSavedProvider";
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
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldCheckbox } from "./RecipientViewPetitionFieldCheckbox";
import { RecipientViewPetitionFieldDynamicSelect } from "./RecipientViewPetitionFieldDynamicSelect";
import { RecipientViewPetitionFieldFileUpload } from "./RecipientViewPetitionFieldFileUpload";
import { RecipientViewPetitionFieldHeading } from "./RecipientViewPetitionFieldHeading";
import { RecipientViewPetitionFieldSelect } from "./RecipientViewPetitionFieldSelect";
import { RecipientViewPetitionFieldText } from "./RecipientViewPetitionFieldText";

export interface RecipientViewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "onDownloadAttachment"
  > {
  keycode: string;
  access: RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment;
  petitionId: string;
  isDisabled: boolean;
}

export type handleUpdateSimpleReplyProps = {
  replyId: string;
  value: string;
};

export type handleDeletePetitionReplyProps = {
  replyId: string;
};

export type handleCreateSimpleReplyProps = {
  value: string;
};

export type handleUpdateCheckboxReplyProps = {
  replyId: string;
  values: string[];
};

export type handleCreateCheckboxReplyProps = {
  values: string[];
};

export type handleUpdateDynamicSelectReplyProps = {
  replyId: string;
  value: [string, string | null][];
};

export type handleCreateDynamicSelectReplyProps = {
  value: [string, string | null][];
};

export type handleCreateFileUploadReplyProps = {
  content: File[];
  uploads: MutableRefObject<Record<string, XMLHttpRequest>>;
};

export type handleDonwloadFileUploadReplyProps = {
  replyId: string;
};

export function RecipientViewPetitionField(props: RecipientViewPetitionFieldProps) {
  const { updateLastSaved } = useLastSaved();

  const [publicPetitionFieldAttachmentDownloadLink] = useMutation(
    RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument
  );
  const handleDownloadAttachment = function (attachmentId: string) {
    openNewWindow(async () => {
      const { data } = await publicPetitionFieldAttachmentDownloadLink({
        variables: {
          keycode: props.keycode,
          fieldId: props.field.id,
          attachmentId,
        },
      });
      const { url } = data!.publicPetitionFieldAttachmentDownloadLink;
      return url!;
    });
  };

  const showFieldComments = usePetitionFieldCommentsDialog();
  async function handleCommentsButtonClick() {
    try {
      await showFieldComments({
        keycode: props.keycode,
        access: props.access,
        field: props.field,
      });
    } catch {}
  }

  const deletePetitionReply = useDeletePetitionReply();
  const handleDeletePetitionReply = async ({ replyId }: handleDeletePetitionReplyProps) => {
    try {
      await deletePetitionReply({
        petitionId: props.petitionId,
        replyId,
        fieldId: props.field.id,
        keycode: props.keycode,
      });
      updateLastSaved();
    } catch {}
  };

  const updateSimpleReply = useUpdateSimpleReply();
  const handleUpdateSimpleReply = async ({ replyId, value }: handleUpdateSimpleReplyProps) => {
    try {
      await updateSimpleReply({
        petitionId: props.petitionId,
        replyId,
        keycode: props.keycode,
        value,
      });
      updateLastSaved();
    } catch {}
  };

  const createSimpleReply = useCreateSimpleReply();
  const handleCreateSimpleReply = async ({ value }: handleCreateSimpleReplyProps) => {
    try {
      const reply = await createSimpleReply({
        petitionId: props.petitionId,
        value,
        fieldId: props.field.id,
        keycode: props.keycode,
      });
      updateLastSaved();
      return reply?.id;
    } catch {}

    return;
  };

  const updateCheckboxReply = useUpdateCheckboxReply();
  const handleUpdateCheckboxReply = async ({ replyId, values }: handleUpdateCheckboxReplyProps) => {
    try {
      await updateCheckboxReply({
        petitionId: props.petitionId,
        replyId,
        keycode: props.keycode,
        values,
      });
      updateLastSaved();
    } catch {}
  };

  const createChekcboxReply = useCreateCheckboxReply();
  const handleCreateCheckboxReply = async ({ values }: handleCreateCheckboxReplyProps) => {
    try {
      await createChekcboxReply({
        petitionId: props.petitionId,
        fieldId: props.field.id,
        keycode: props.keycode,
        values,
      });
      updateLastSaved();
    } catch {}
  };

  const updateDynamicSelectReply = useUpdateDynamicSelectReply();
  const handleUpdateDynamicSelectReply = async ({
    replyId,
    value,
  }: handleUpdateDynamicSelectReplyProps) => {
    await updateDynamicSelectReply({
      petitionId: props.petitionId,
      keycode: props.keycode,
      replyId,
      value,
    });
    updateLastSaved();
  };

  const createDynamicSelectReply = useCreateDynamicSelectReply();
  const handleCreateDynamicSelectReply = async ({ value }: handleCreateDynamicSelectReplyProps) => {
    try {
      const reply = await createDynamicSelectReply({
        petitionId: props.petitionId,
        keycode: props.keycode,
        fieldId: props.field.id,
        value,
      });
      updateLastSaved();
      return reply?.id;
    } catch {}
  };

  const createFileUploadReply = useCreateFileUploadReply();
  const handleCreateFileUploadReply = async ({
    content,
    uploads,
  }: handleCreateFileUploadReplyProps) => {
    try {
      createFileUploadReply({
        petitionId: props.petitionId,
        keycode: props.keycode,
        fieldId: props.field.id,
        content,
        uploads,
      });
      updateLastSaved();
    } catch {}
  };

  const [downloadFileUploadReply] = useMutation(
    RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument
  );
  const handleDonwloadFileUploadReply = async ({ replyId }: handleDonwloadFileUploadReplyProps) => {
    try {
      const { data } = await downloadFileUploadReply({
        variables: {
          keycode: props.keycode,
          replyId,
          preview: false,
        },
      });
      return data;
    } catch {}
  };

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

RecipientViewPetitionField.fragments = {
  PublicPetitionAccess: gql`
    fragment RecipientViewPetitionField_PublicPetitionAccess on PublicPetitionAccess {
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccess
    }
    ${RecipientViewPetitionFieldCommentsDialog.fragments.PublicPetitionAccess}
  `,
  PublicPetitionField: gql`
    fragment RecipientViewPetitionField_PublicPetitionField on PublicPetitionField {
      ...RecipientViewPetitionFieldCard_PublicPetitionField
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionField}
  `,
};

RecipientViewPetitionField.mutations = [
  gql`
    mutation RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLink(
      $keycode: ID!
      $fieldId: GID!
      $attachmentId: GID!
    ) {
      publicPetitionFieldAttachmentDownloadLink(
        keycode: $keycode
        fieldId: $fieldId
        attachmentId: $attachmentId
      ) {
        url
      }
    }
  `,
];
