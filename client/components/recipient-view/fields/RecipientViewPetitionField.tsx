import { gql, useMutation } from "@apollo/client";
import {
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment,
  RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { useLastSaved } from "../LastSavedProvider";
import { useCreateSimpleReply, useDeletePetitionReply, useUpdateSimpleReply } from "./mutations";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldCheckbox } from "./RecipientViewPetitionFieldCheckbox";
import {
  RecipientViewPetitionFieldCommentsDialog,
  usePetitionFieldCommentsDialog,
} from "./RecipientViewPetitionFieldCommentsDialog";
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

export type handleUpdateFieldTextReplyProps = {
  replyId: string;
  value: string;
};

export type handleDeleteFieldTextReplyProps = {
  replyId: string;
};

export type handleCreateFieldTextReplyProps = {
  value: string;
};

export function RecipientViewPetitionField(props: RecipientViewPetitionFieldProps) {
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

  const { updateLastSaved } = useLastSaved();

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

  const updateFieldTextReply = useUpdateSimpleReply();
  const handleUpdateFieldTextReply = async ({
    replyId,
    value,
  }: handleUpdateFieldTextReplyProps) => {
    try {
      await updateFieldTextReply({
        petitionId: props.petitionId,
        replyId,
        keycode: props.keycode,
        value,
      });
      updateLastSaved();
    } catch {}
  };

  const deleteFieldTextReply = useDeletePetitionReply();
  const handleDeleteFieldTextReply = async ({ replyId }: handleDeleteFieldTextReplyProps) => {
    try {
      await deleteFieldTextReply({
        petitionId: props.petitionId,
        replyId,
        fieldId: props.field.id,
        keycode: props.keycode,
      });
      updateLastSaved();
    } catch {}
  };

  const createFieldTextReply = useCreateSimpleReply();
  const handleCreateFieldTextReply = async ({ value }: handleCreateFieldTextReplyProps) => {
    try {
      const reply = await createFieldTextReply({
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
      onDeleteReply={handleDeleteFieldTextReply}
      onUpdateReply={handleUpdateFieldTextReply}
      onCreateReply={handleCreateFieldTextReply}
    />
  ) : props.field.type === "SELECT" ? (
    <RecipientViewPetitionFieldSelect {...props} {...commonProps} />
  ) : props.field.type === "FILE_UPLOAD" ? (
    <RecipientViewPetitionFieldFileUpload {...props} {...commonProps} />
  ) : props.field.type === "DYNAMIC_SELECT" ? (
    <RecipientViewPetitionFieldDynamicSelect {...props} {...commonProps} />
  ) : props.field.type === "CHECKBOX" ? (
    <RecipientViewPetitionFieldCheckbox {...props} {...commonProps} />
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
