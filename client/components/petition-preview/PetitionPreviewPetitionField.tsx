import { useCallback } from "react";
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

export interface PetitionPreviewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply" | "onDownloadAttachment"
  > {
  petitionId: string;
  isDisabled: boolean;
}

export function PetitionPreviewPetitionField(props: PetitionPreviewPetitionFieldProps) {
  const handleDownloadAttachment = function (attachmentId: string) {};

  async function handleCommentsButtonClick() {
    try {
    } catch {}
  }

  const handleDeletePetitionReply = useCallback(async (replyId: string) => {
    try {
    } catch {}
  }, []);

  const handleUpdateSimpleReply = useCallback(async (replyId: string, value: string) => {
    try {
    } catch {}
  }, []);

  const handleCreateSimpleReply = useCallback(async (value: string) => {
    try {
      return "";
    } catch {}

    return;
  }, []);

  const handleUpdateCheckboxReply = useCallback(async (replyId: string, values: string[]) => {
    try {
    } catch {}
  }, []);

  const handleCreateCheckboxReply = useCallback(async (values: CheckboxValue) => {
    try {
    } catch {}
  }, []);

  const handleUpdateDynamicSelectReply = useCallback(
    async (replyId: string, value: DynamicSelectValue) => {},
    []
  );

  const handleCreateDynamicSelectReply = useCallback(async (value: DynamicSelectValue) => {
    try {
      return "";
    } catch {}
  }, []);

  const handleCreateFileUploadReply = useCallback(async (content: File[]) => {
    try {
    } catch {}
  }, []);

  const handleDonwloadFileUploadReply = useCallback(async (replyId: string) => {
    try {
    } catch {}
  }, []);

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
