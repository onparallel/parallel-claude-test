import { gql } from "@apollo/client";
import { Box, Heading, Stack, Switch } from "@chakra-ui/react";
import { Card, CardHeader } from "@parallel/components/common/Card";
import {
  PetitionComposeFieldSettings_PetitionFieldFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useState } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionFieldTypeSelect } from "../PetitionFieldTypeSelectDropdown";
import { CheckboxSettings } from "./PetitionComposeCheckboxSettings";
import { DynamicSelectSettings } from "./PetitionComposeDynamicSelectFieldSettings";
import { FileUploadSettings } from "./PetitionComposeFileUploadSettings";
import { HeadingSettings } from "./PetitionComposeHeadingSettings";
import { NumberSettings } from "./PetitionComposeNumberSettings";
import { SelectOptionSettings } from "./PetitionComposeSelectOptionSettings";
import { TextSettings } from "./PetitionComposeTextSettings";
import { SettingsRow } from "./SettingsRow";
import { SettingsRowAlias } from "./SettingsRowAlias";

export type PetitionComposeFieldSettingsProps = {
  petitionId: string;
  field: PetitionComposeFieldSettings_PetitionFieldFragment;
  onFieldTypeChange: (fieldId: string, type: PetitionFieldType) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  onClose: () => void;
  isReadOnly?: boolean;
  hasDeveloperAccess?: boolean;
};

export function PetitionComposeFieldSettings({
  petitionId,
  field,
  onFieldEdit,
  onFieldTypeChange,
  onClose,
  isReadOnly,
  hasDeveloperAccess,
}: PetitionComposeFieldSettingsProps) {
  const [alias, setAlias] = useState(field.alias ?? "");
  const [aliasIsInvalid, setAliasIsInvalid] = useState(false);

  const debouncedOnUpdate = useDebouncedCallback(
    async (fieldId, data) => {
      try {
        await onFieldEdit(fieldId, data);
        if (aliasIsInvalid) setAliasIsInvalid(false);
      } catch (error) {
        if (isApolloError(error, "ALIAS_ALREADY_EXISTS")) {
          setAliasIsInvalid(true);
        }
      }
    },
    300,
    [field.id, aliasIsInvalid]
  );
  const handleAliasChange = function (event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setAlias(value);
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
      },
      alias: value || null,
    });
  };

  return (
    <Card>
      <CardHeader isCloseable onClose={onClose}>
        <FormattedMessage id="petition.field-settings" defaultMessage="Field settings" />
      </CardHeader>
      <Stack spacing={4} padding={4} direction="column">
        <Box>
          <PetitionFieldTypeSelect
            type={field.type}
            onChange={(type) => {
              if (type !== field.type) {
                onFieldTypeChange(field.id, type);
              }
            }}
            isDisabled={isReadOnly || field.isFixed}
          />
        </Box>
        <SettingsRow
          isDisabled={isReadOnly || field.isInternal}
          label={
            <FormattedMessage
              id="component.petition-settings.petition-comments-enable"
              defaultMessage="Allow comments"
            />
          }
          controlId="enable-comments"
        >
          <Switch
            height="20px"
            display="block"
            id="enable-comments"
            color="green"
            isChecked={field.isInternal ? false : field.options.hasCommentsEnabled}
            onChange={(event) =>
              onFieldEdit(field.id, {
                options: { ...field.options, hasCommentsEnabled: event.target.checked },
              })
            }
            isDisabled={isReadOnly || field.isInternal}
          />
        </SettingsRow>

        <SettingsRow
          isDisabled={isReadOnly || field.isFixed}
          label={
            <FormattedMessage
              id="component.petition-settings.petition-internal-field"
              defaultMessage="Internal field"
            />
          }
          description={
            <FormattedMessage
              id="field-settings.internal-field-description"
              defaultMessage="Enabling this will make the field invisible to the recipient."
            />
          }
          controlId="internal-field"
        >
          <Switch
            height="20px"
            display="block"
            id="internal-field"
            color="green"
            isChecked={field.isInternal}
            onChange={(event) =>
              onFieldEdit(field.id, {
                isInternal: event.target.checked,
                showInPdf: !event.target.checked,
              })
            }
            isDisabled={isReadOnly || field.isFixed}
          />
        </SettingsRow>
        <SettingsRow
          isDisabled={isReadOnly}
          label={
            <FormattedMessage
              id="component.petition-settings.petition-shown-in-pdf"
              defaultMessage="Show in PDF"
            />
          }
          description={
            <FormattedMessage
              id="field-settings.show-in-pdf-description"
              defaultMessage="Enabling this option will make the content appear in the exported PDF and the document to be signed."
            />
          }
          controlId="show-in-pdf"
        >
          <Switch
            height="20px"
            display="block"
            id="show-in-pdf"
            color="green"
            isChecked={field.showInPdf}
            onChange={(event) =>
              onFieldEdit(field.id, {
                showInPdf: event.target.checked,
              })
            }
            isDisabled={isReadOnly}
          />
        </SettingsRow>

        {!field.isReadOnly && field.type !== "CHECKBOX" && (
          <SettingsRow
            isDisabled={isReadOnly}
            label={
              field.type === "FILE_UPLOAD" ? (
                <FormattedMessage
                  id="field-settings.file-multiple-label"
                  defaultMessage="Allow uploading more than one file"
                />
              ) : (
                <FormattedMessage
                  id="field-settings.multiple-label"
                  defaultMessage="Allow more than one reply"
                />
              )
            }
            description={
              field.type === "FILE_UPLOAD" ? (
                <FormattedMessage
                  id="field-settings.file-multiple-description"
                  defaultMessage="Enabling this allows the recipient to upload multiple files to this field."
                />
              ) : (
                <FormattedMessage
                  id="field-settings.multiple-description"
                  defaultMessage="Enabling this allows the recipient to submit multiple answers to this field."
                />
              )
            }
            controlId="field-multiple"
          >
            <Switch
              height="20px"
              display="block"
              id="field-multiple"
              color="green"
              isChecked={field.multiple}
              onChange={(event) => onFieldEdit(field.id, { multiple: event.target.checked })}
              isDisabled={isReadOnly}
            />
          </SettingsRow>
        )}
        {field.type === "HEADING" ? (
          <HeadingSettings field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly} />
        ) : field.type === "FILE_UPLOAD" ? (
          <FileUploadSettings field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly} />
        ) : field.type === "TEXT" || field.type === "SHORT_TEXT" ? (
          <TextSettings field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly} />
        ) : field.type === "SELECT" ? (
          <SelectOptionSettings field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly} />
        ) : field.type === "DYNAMIC_SELECT" ? (
          <DynamicSelectSettings
            petitionId={petitionId}
            field={field}
            onFieldEdit={onFieldEdit}
            isReadOnly={isReadOnly}
          />
        ) : field.type === "CHECKBOX" ? (
          <CheckboxSettings field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly} />
        ) : field.type === "NUMBER" ? (
          <NumberSettings field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly} />
        ) : null}
      </Stack>
      {hasDeveloperAccess && field.type !== "HEADING" ? (
        <Stack padding={4} paddingTop={2} spacing={3}>
          <Heading flex="1" as="h4" size="sm" overflowWrap="anywhere">
            <FormattedMessage id="petition.developers" defaultMessage="Developers" />
          </Heading>
          <SettingsRowAlias
            alias={alias}
            onChange={handleAliasChange}
            isReadOnly={isReadOnly}
            isInvalid={aliasIsInvalid}
          />
        </Stack>
      ) : null}
    </Card>
  );
}

PetitionComposeFieldSettings.fragments = {
  PetitionField: gql`
    fragment PetitionComposeFieldSettings_PetitionField on PetitionField {
      id
      type
      optional
      multiple
      options
      isInternal
      isReadOnly
      showInPdf
      isFixed
      position
      visibility
      alias
    }
  `,
};
