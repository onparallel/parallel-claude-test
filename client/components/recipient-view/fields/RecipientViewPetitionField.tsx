import { gql, useMutation } from "@apollo/client";
import { RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument } from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
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
  petitionId: string;
  isDisabled: boolean;
}

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
  return props.field.type === "HEADING" ? (
    <RecipientViewPetitionFieldHeading {...props} onDownloadAttachment={handleDownloadAttachment} />
  ) : props.field.type === "TEXT" || props.field.type === "SHORT_TEXT" ? (
    <RecipientViewPetitionFieldText {...props} onDownloadAttachment={handleDownloadAttachment} />
  ) : props.field.type === "SELECT" ? (
    <RecipientViewPetitionFieldSelect {...props} onDownloadAttachment={handleDownloadAttachment} />
  ) : props.field.type === "FILE_UPLOAD" ? (
    <RecipientViewPetitionFieldFileUpload
      {...props}
      onDownloadAttachment={handleDownloadAttachment}
    />
  ) : props.field.type === "DYNAMIC_SELECT" ? (
    <RecipientViewPetitionFieldDynamicSelect
      {...props}
      onDownloadAttachment={handleDownloadAttachment}
    />
  ) : props.field.type === "CHECKBOX" ? (
    <RecipientViewPetitionFieldCheckbox
      {...props}
      onDownloadAttachment={handleDownloadAttachment}
    />
  ) : null;
}

RecipientViewPetitionField.fragments = {
  PublicPetitionAccess: gql`
    fragment RecipientViewPetitionField_PublicPetitionAccess on PublicPetitionAccess {
      ...RecipientViewPetitionFieldCard_PublicPetitionAccess
    }
    ${RecipientViewPetitionFieldCard.fragments.PublicPetitionAccess}
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
