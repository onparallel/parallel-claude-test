import { gql } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  FormErrorMessage,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { AliasOptionsMenu } from "@parallel/components/petition-common/AliasOptionsMenu";
import { CopyAliasIconButton } from "@parallel/components/petition-common/CopyAliasIconButton";
import {
  SettingsRowAlias_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { REFERENCE_REGEX } from "@parallel/utils/validation";
import { ChangeEvent, useState } from "react";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { SettingsRow } from "./SettingsRow";

export type AliasErrorType = "UNIQUE" | "INVALID";

type SettingsRowAliasProps = {
  field: SettingsRowAlias_PetitionFieldFragment;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  isReadOnly?: boolean;
};

export function SettingsRowAlias({ field, onFieldEdit, isReadOnly }: SettingsRowAliasProps) {
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

  const showAliasButtons =
    field.type === "HEADING" || field.type === "DYNAMIC_SELECT" || isFileTypeField(field.type)
      ? false
      : true;

  return (
    <>
      <SettingsRow
        data-section="field-reference"
        isDisabled={isReadOnly}
        label={<FormattedMessage id="field-settings.alias-label" defaultMessage="References" />}
        description={
          <Text fontSize="sm">
            <FormattedMessage
              id="field-settings.alias-description"
              defaultMessage="Allows to easily identify the field in API replies. In addition, it can be inserted into the field description to automatically replace the content."
            />
            <HelpCenterLink marginLeft={1} articleId={5998723}>
              <FormattedMessage id="generic.learn-more" defaultMessage="Learn more" />
            </HelpCenterLink>
          </Text>
        }
        controlId="alias-field"
        isInvalid={isDefined(aliasError)}
      >
        <Stack width="100%">
          <HStack>
            <Input value={alias} size="sm" onChange={handleAliasChange} maxLength={100} />
            {showAliasButtons ? (
              <>
                <CopyAliasIconButton
                  field={field}
                  isDisabled={!alias || Boolean(aliasError)}
                  size="sm"
                  variant="outline"
                />
                <AliasOptionsMenu field={field} size="sm" boxShadow="none" variant="outline" />
              </>
            ) : null}
          </HStack>
          <FormErrorMessage>
            {aliasError === "INVALID" ? (
              <FormattedMessage
                id="field-settings.reference-invalid-error"
                defaultMessage="Use only letters, numbers or _"
              />
            ) : (
              <FormattedMessage
                id="field-settings.reference-exists-error"
                defaultMessage="This reference is already in use."
              />
            )}
          </FormErrorMessage>
        </Stack>
      </SettingsRow>
      <PaddedCollapse in={isFileTypeField(field.type) && showDocumentReferenceAlert}>
        <CloseableAlert status="warning" rounded="md">
          <AlertIcon color="yellow.500" />
          <AlertDescription width="100%">
            <FormattedMessage
              id="component.petition-compose-field-settings.alias-warning"
              defaultMessage="<b>Note:</b> Document fields cannot be used to replace content in descriptions."
            />
          </AlertDescription>
        </CloseableAlert>
      </PaddedCollapse>
    </>
  );
}

SettingsRowAlias.fragments = {
  PetitionField: gql`
    fragment SettingsRowAlias_PetitionField on PetitionField {
      id
      type
      alias
      ...CopyAliasIconButton_PetitionField
      ...AliasOptionsMenu_PetitionField
    }
    ${CopyAliasIconButton.fragments.PetitionField}
    ${AliasOptionsMenu.fragments.PetitionField}
  `,
};
