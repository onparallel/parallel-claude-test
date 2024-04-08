import { gql } from "@apollo/client";
import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { CloseableCardHeader } from "@parallel/components/common/Card";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  PetitionComposeFieldSettings_PetitionBaseFragment,
  PetitionComposeFieldSettings_PetitionFieldFragment,
  PetitionComposeFieldSettings_UserFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { ComponentType, PropsWithChildren, ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { PetitionFieldTypeSelect } from "../PetitionFieldTypeSelect";
import { PetitionComposeBackgroundCheckSettings } from "./fields/PetitionComposeBackgroundCheckSettings";
import { PetitionComposeCheckboxSettings } from "./fields/PetitionComposeCheckboxSettings";
import { PetitionComposeDynamicSelectFieldSettings } from "./fields/PetitionComposeDynamicSelectFieldSettings";
import { PetitionComposeFieldGroupSettings } from "./fields/PetitionComposeFieldGroupSettings";
import { PetitionComposeHeadingSettings } from "./fields/PetitionComposeHeadingSettings";
import { PetitionComposeNumberSettings } from "./fields/PetitionComposeNumberSettings";
import { PetitionComposeSelectSettings } from "./fields/PetitionComposeSelectSettings";
import { PetitionComposeShortTextSettings } from "./fields/PetitionComposeShortTextSettings";
import { AllowCommentSettingsRow } from "./rows/AllowCommentSettingsRow";
import { AllowMultipleFilesSettingsRow } from "./rows/AllowMultipleFilesSettingsRow";
import { AllowMultipleRepliesSettingsRow } from "./rows/AllowMultipleRepliesSettingsRow";
import { AttachFilesToPdfSettingsRow } from "./rows/AttachFilesToPdfSettingsRow";
import { IncludeApprovalSettingsRow } from "./rows/IncludeApprovalSettingsRow";
import { InternalFieldSettingsRow } from "./rows/InternalFieldSettingsRow";
import { SettingsRowAlias } from "./rows/SettingsRowAlias";
import { SettingsRowPlaceholder } from "./rows/SettingsRowPlaceholder";
import { ShowPdfSettingsRow } from "./rows/ShowPdfSettingsRow";
import { ShowReplyActivitySettingsRow } from "./rows/ShowReplyActivitySettingsRow";

export interface PetitionComposeFieldSettingsProps {
  petition: PetitionComposeFieldSettings_PetitionBaseFragment;
  user: PetitionComposeFieldSettings_UserFragment;
  field: PetitionComposeFieldSettings_PetitionFieldFragment;
  fieldIndex: PetitionFieldIndex;
  onFieldTypeChange: (fieldId: string, type: PetitionFieldType) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  onClose: () => void;
  isReadOnly?: boolean;
  children?: ReactNode;
}

const COMPONENTS: Partial<
  Record<
    PetitionFieldType,
    ComponentType<
      Pick<PetitionComposeFieldSettingsProps, "petition" | "field" | "onFieldEdit" | "isReadOnly">
    >
  >
> = {
  HEADING: PetitionComposeHeadingSettings,
  CHECKBOX: PetitionComposeCheckboxSettings,
  DYNAMIC_SELECT: PetitionComposeDynamicSelectFieldSettings,
  SELECT: PetitionComposeSelectSettings,
  FIELD_GROUP: PetitionComposeFieldGroupSettings,
  NUMBER: PetitionComposeNumberSettings,
  SHORT_TEXT: PetitionComposeShortTextSettings,
  BACKGROUND_CHECK: PetitionComposeBackgroundCheckSettings,
};

export const PetitionComposeFieldSettings = Object.assign(
  chakraForwardRef<"section", PetitionComposeFieldSettingsProps>(
    function PetitionComposeFieldSettings(
      {
        petition,
        user,
        field,
        fieldIndex,
        onFieldEdit,
        onFieldTypeChange,
        onClose,
        isReadOnly,
        ...props
      },
      ref,
    ) {
      const showErrorDialog = useErrorDialog();

      const isFieldGroupChild = isDefined(field.parent);

      const showInPdf = isFieldGroupChild ? field.parent!.showInPdf : field.showInPdf;

      const parentIsInternal = isFieldGroupChild ? field.parent!.isInternal : false;

      const canOnlyBeInternal = ["DOW_JONES_KYC", "BACKGROUND_CHECK"].includes(field.type);

      const isInternalFieldDisabled =
        isReadOnly ||
        field.isFixed ||
        canOnlyBeInternal ||
        parentIsInternal ||
        (isFieldGroupChild && field.position === 0);

      const canChangeFieldType = !["FIELD_GROUP"].includes(field.type);

      const canChangeMultiple = ![
        "HEADING",
        "CHECKBOX",
        "ES_TAX_DOCUMENTS",
        "DOW_JONES_KYC",
        "BACKGROUND_CHECK",
      ].includes(field.type);

      const isReplyable = !["HEADING", "FIELD_GROUP"].includes(field.type);

      const hasPlaceholder = (
        ["SHORT_TEXT", "TEXT", "PHONE", "NUMBER", "SELECT"] as PetitionFieldType[]
      ).includes(field.type);

      const hasAlias = !["HEADING"].includes(field.type);

      const handleFieldEdit = (data: UpdatePetitionFieldInput) => {
        onFieldEdit(field.id, data);
      };

      const SettingsComponent = COMPONENTS[field.type] ?? EmptySettings;

      return (
        <Box ref={ref} display="flex" flexDirection="column" {...props}>
          <CloseableCardHeader onClose={onClose}>
            <Text as="span" noOfLines={1} wordBreak="break-all">
              <Text as="span">{`${fieldIndex}. `}</Text>
              {field.title ? (
                <Text as="span">{field.title}</Text>
              ) : (
                <Text as="span" textStyle="hint" fontWeight={500}>
                  <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
                </Text>
              )}
            </Text>
          </CloseableCardHeader>

          <Stack
            as="section"
            padding={4}
            paddingBottom="80px"
            spacing={5}
            flex={1}
            minHeight={0}
            overflow="auto"
          >
            <Stack>
              {canChangeFieldType ? (
                <Box>
                  <PetitionFieldTypeSelect
                    type={field.type}
                    onChange={async (type) => {
                      if (type !== field.type) {
                        const isTypeChangeNotAllowed =
                          isFieldGroupChild &&
                          (type === "DOW_JONES_KYC" || type === "BACKGROUND_CHECK") &&
                          field.position === 0 &&
                          !field.parent!.isInternal;

                        if (isTypeChangeNotAllowed) {
                          try {
                            await showErrorDialog({
                              message: (
                                <FormattedMessage
                                  id="component.petition-compose-field-settings.first-child-is-internal-error"
                                  defaultMessage="The first field of a group cannot be internal if the group is not."
                                />
                              ),
                            });
                          } catch {}
                        } else {
                          onFieldTypeChange(field.id, type);
                        }
                      }
                    }}
                    isDisabled={isReadOnly || field.isFixed}
                    user={user}
                    isFieldGroupChild={isFieldGroupChild}
                  />
                </Box>
              ) : null}
              <SettingsComponent
                petition={petition}
                field={field}
                onFieldEdit={onFieldEdit}
                isReadOnly={isReadOnly}
              />
              {canChangeMultiple ? (
                field.type === "FILE_UPLOAD" ? (
                  <AllowMultipleFilesSettingsRow
                    isDisabled={isReadOnly}
                    isChecked={field.multiple}
                    onChange={handleFieldEdit}
                  />
                ) : (
                  <AllowMultipleRepliesSettingsRow
                    isDisabled={isReadOnly}
                    isChecked={field.multiple}
                    onChange={handleFieldEdit}
                  />
                )
              ) : null}

              {hasPlaceholder ? (
                <SettingsRowPlaceholder
                  field={field}
                  onFieldEdit={onFieldEdit}
                  isReadOnly={isReadOnly}
                />
              ) : null}

              {hasAlias ? (
                <SettingsRowAlias field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly} />
              ) : null}
            </Stack>

            {petition.isInteractionWithRecipientsEnabled ? (
              <SettingsRowGroup
                isReadOnly={isReadOnly}
                label={
                  <FormattedMessage
                    id="component.petition-compose-field-settings.interaction-with-recipients"
                    defaultMessage="Interaction with recipients"
                  />
                }
              >
                <InternalFieldSettingsRow
                  isChecked={field.isInternal}
                  isDisabled={isInternalFieldDisabled}
                  isRestricted={canOnlyBeInternal}
                  onChange={handleFieldEdit}
                />
                {isFieldGroupChild || canOnlyBeInternal ? null : (
                  <AllowCommentSettingsRow
                    isDisabled={isReadOnly || field.isInternal}
                    isChecked={field.isInternal ? false : field.hasCommentsEnabled}
                    onChange={handleFieldEdit}
                  />
                )}
              </SettingsRowGroup>
            ) : null}

            {isReplyable && petition.isReviewFlowEnabled ? (
              <SettingsRowGroup
                label={
                  <FormattedMessage
                    id="component.petition-compose-field-settings.review-flow"
                    defaultMessage="Review flow"
                  />
                }
                isReadOnly={isReadOnly}
              >
                <IncludeApprovalSettingsRow
                  isDisabled={isReadOnly}
                  isChecked={field.requireApproval}
                  onChange={handleFieldEdit}
                />
              </SettingsRowGroup>
            ) : null}

            {isFieldGroupChild ||
            field.type === "DOW_JONES_KYC" ||
            field.type === "BACKGROUND_CHECK" ||
            !petition.isDocumentGenerationEnabled ? null : (
              <SettingsRowGroup
                label={
                  <FormattedMessage
                    id="component.petition-compose-field-settings.document-generation"
                    defaultMessage="Document generation"
                  />
                }
                isReadOnly={isReadOnly}
              >
                {isFieldGroupChild || canOnlyBeInternal ? null : (
                  <ShowPdfSettingsRow
                    isDisabled={isReadOnly}
                    isChecked={showInPdf}
                    onChange={handleFieldEdit}
                  />
                )}
                {showInPdf && isReplyable ? (
                  <ShowReplyActivitySettingsRow
                    isDisabled={isReadOnly}
                    isChecked={field.showActivityInPdf}
                    onChange={handleFieldEdit}
                  />
                ) : null}
                {isFileTypeField(field.type) ? (
                  <AttachFilesToPdfSettingsRow
                    isDisabled={isReadOnly}
                    isChecked={field.options.attachToPdf}
                    onChange={handleFieldEdit}
                  />
                ) : null}
              </SettingsRowGroup>
            )}
          </Stack>
        </Box>
      );
    },
  ),
  {
    fragments: {
      User: gql`
        fragment PetitionComposeFieldSettings_User on User {
          ...PetitionFieldTypeSelect_User
        }
        ${PetitionFieldTypeSelect.fragments.User}
      `,
      PetitionBase: gql`
        fragment PetitionComposeFieldSettings_PetitionBase on PetitionBase {
          id
          isInteractionWithRecipientsEnabled
          isReviewFlowEnabled
          isDocumentGenerationEnabled
        }
      `,
      PetitionField: gql`
        fragment PetitionComposeFieldSettings_PetitionField on PetitionField {
          id
          type
          title
          optional
          multiple
          options
          isInternal
          isReadOnly
          showInPdf
          showActivityInPdf
          isFixed
          position
          visibility
          alias
          hasCommentsEnabled
          requireApproval
          parent {
            id
            showInPdf
            isInternal
            children {
              id
              type
            }
          }
          ...SettingsRowAlias_PetitionField
        }
        ${SettingsRowAlias.fragments.PetitionField}
      `,
    },
  },
);

function EmptySettings({
  children,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly" | "children">) {
  return <>{children}</>;
}

function SettingsRowGroup({
  isReadOnly,
  label,
  children,
}: PropsWithChildren<{ label: ReactNode; isReadOnly?: boolean }>) {
  return (
    <Stack spacing={2} as="section">
      <Heading
        as="h4"
        size="sm"
        overflowWrap="anywhere"
        textStyle={isReadOnly ? "muted" : undefined}
      >
        {label}
      </Heading>
      {children}
    </Stack>
  );
}
