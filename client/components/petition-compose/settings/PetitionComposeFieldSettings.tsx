import { gql } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Box,
  Heading,
  Image,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import {
  PetitionComposeFieldSettings_PetitionFieldFragment,
  PetitionComposeFieldSettings_UserFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { REFERENCE_REGEX } from "@parallel/utils/validation";
import { ChangeEvent, ReactNode, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { PetitionFieldTypeSelect } from "../PetitionFieldTypeSelect";
import { CheckboxSettings } from "./PetitionComposeCheckboxSettings";
import { DynamicSelectSettings } from "./PetitionComposeDynamicSelectFieldSettings";
import { FileUploadSettings } from "./PetitionComposeFileUploadSettings";
import { HeadingSettings } from "./PetitionComposeHeadingSettings";
import { NumberSettings } from "./PetitionComposeNumberSettings";
import { PhoneSettings } from "./PetitionComposePhoneSettings";
import { SelectOptionSettings } from "./PetitionComposeSelectOptionSettings";
import { ShortTextSettings } from "./PetitionComposeShortTextSettings";
import { SpanishTaxDocumentsSettings } from "./PetitionComposeTaxDocumentsSettings";
import { TextSettings } from "./PetitionComposeTextSettings";
import { SettingsRow } from "./SettingsRow";
import { AliasErrorType, SettingsRowAlias } from "./SettingsRowAlias";

export type PetitionComposeFieldSettingsProps = {
  petitionId: string;
  user: PetitionComposeFieldSettings_UserFragment;
  field: PetitionComposeFieldSettings_PetitionFieldFragment;
  onFieldTypeChange: (fieldId: string, type: PetitionFieldType) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  onClose: () => void;
  isReadOnly?: boolean;
  children?: ReactNode;
};

export function PetitionComposeFieldSettings({
  petitionId,
  user,
  field,
  onFieldEdit,
  onFieldTypeChange,
  onClose,
  isReadOnly,
}: PetitionComposeFieldSettingsProps) {
  const intl = useIntl();
  const [alias, setAlias] = useState(field.alias ?? "");
  const [aliasError, setAliasError] = useState<AliasErrorType | null>(null);
  const [showDocumentReferenceAlert, setShowDocumentReferenceAlert] = useState(false);

  const debouncedOnUpdate = useDebouncedCallback(
    async (fieldId, data) => {
      try {
        await onFieldEdit(fieldId, data);
        if (isDefined(aliasError)) setAliasError(null);
      } catch (error) {
        if (isApolloError(error, "ALIAS_ALREADY_EXISTS")) {
          setAliasError("UNIQUE");
        }
      }
    },
    300,
    [field.id, aliasError]
  );
  const handleAliasChange = function (event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    if (value && isFileTypeField(field.type)) {
      setShowDocumentReferenceAlert(true);
    }
    setAlias(value);

    if (!value || REFERENCE_REGEX.test(value)) {
      debouncedOnUpdate(field.id, {
        options: {
          ...field.options,
        },
        alias: value || null,
      });
    } else {
      setAliasError("INVALID");
    }
  };

  const commonSettings = (
    <>
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
          isChecked={field.isInternal ? false : field.hasCommentsEnabled}
          onChange={(event) =>
            onFieldEdit(field.id, {
              hasCommentsEnabled: event.target.checked,
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
          <>
            <FormattedMessage
              id="field-settings.show-in-pdf-description"
              defaultMessage="Enabling this option will make the content appear in the exported PDF and the document to be signed."
            />
            <Image
              marginTop={2}
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/field-types/FILE_UPLOAD_show_in_pdf_setting_${intl.locale}.png`}
            />
          </>
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
      {!field.isReadOnly && !["CHECKBOX", "ES_TAX_DOCUMENTS"].includes(field.type) && (
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
    </>
  );

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
            user={user}
          />
        </Box>
        {field.type !== "SHORT_TEXT" ? commonSettings : null}
        {field.type === "HEADING" ? (
          <HeadingSettings field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly} />
        ) : field.type === "FILE_UPLOAD" ? (
          <FileUploadSettings field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly} />
        ) : field.type === "TEXT" ? (
          <TextSettings field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly} />
        ) : field.type === "SHORT_TEXT" ? (
          <ShortTextSettings field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly}>
            {commonSettings}
          </ShortTextSettings>
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
        ) : field.type === "PHONE" ? (
          <PhoneSettings field={field} onFieldEdit={onFieldEdit} isReadOnly={isReadOnly} />
        ) : field.type === "ES_TAX_DOCUMENTS" ? (
          <SpanishTaxDocumentsSettings
            field={field}
            onFieldEdit={onFieldEdit}
            isReadOnly={isReadOnly}
          />
        ) : null}
      </Stack>
      {field.type !== "HEADING" ? (
        <Stack padding={4} paddingTop={2} spacing={3}>
          <Heading
            flex="1"
            as="h4"
            size="sm"
            overflowWrap="anywhere"
            textStyle={isReadOnly ? "muted" : undefined}
          >
            <FormattedMessage id="petition.advanced-options" defaultMessage="Advanced options" />
          </Heading>
          <SettingsRowAlias
            alias={alias}
            onChange={handleAliasChange}
            isReadOnly={isReadOnly}
            errorType={aliasError}
          />
          <PaddedCollapse in={isFileTypeField(field.type) && showDocumentReferenceAlert}>
            <CloseableAlert status="warning" rounded="md">
              <AlertIcon color="yellow.500" />
              <AlertDescription>
                <Text>
                  <FormattedMessage
                    id="component.petition-compose-field-settings.alias-warning"
                    defaultMessage="<b>Note:</b> Document fields cannot be used to replace content in descriptions."
                  />
                </Text>
              </AlertDescription>
            </CloseableAlert>
          </PaddedCollapse>
        </Stack>
      ) : null}
    </Card>
  );
}

PetitionComposeFieldSettings.fragments = {
  User: gql`
    fragment PetitionComposeFieldSettings_User on User {
      ...PetitionFieldTypeSelect_User
    }
    ${PetitionFieldTypeSelect.fragments.User}
  `,
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
      hasCommentsEnabled
    }
  `,
};
