import { gql, useMutation } from "@apollo/client";
import { Box, HStack, Text } from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import {
  ConfigureAutomateSearchDialog,
  useConfigureAutomateSearchDialog,
} from "../../dialogs/ConfigureAutomateSearchDialog";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { SettingsRowButton } from "../rows/SettingsRowButton";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import { PetitionComposeBackgroundCheckSettings_updatePetitionFieldAutoSearchConfigDocument } from "@parallel/graphql/__types";

export function PetitionComposeBackgroundCheckSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const intl = useIntl();
  const options = field.options as FieldOptions["BACKGROUND_CHECK"];
  const isDisabled = field.visibility !== null || isReadOnly || field.isFixed;

  const providers = [] as {
    value: string;
    label: string;
  }[];

  const [updatePetitionFieldAutoSearchConfig] = useMutation(
    PetitionComposeBackgroundCheckSettings_updatePetitionFieldAutoSearchConfigDocument,
  );

  const showAutomateSearchDialog = useConfigureAutomateSearchDialog();

  const handleAutomateSearchChange = async (remove?: boolean) => {
    try {
      if (remove) {
        onFieldEdit(field.id, {
          options: {
            ...field.options,
            autoSearchConfig: null,
          },
        });
      } else {
        const config = await showAutomateSearchDialog({
          fields: field.petition.fields,
          field,
        });

        await updatePetitionFieldAutoSearchConfig({
          variables: {
            fieldId: field.id,
            petitionId: field.petition.id,
            config,
          },
        });
      }
    } catch (e) {
      if (isDialogError(e) && e.reason === "DELETE_AUTO_SEARCH_CONFIG") {
        try {
          onFieldEdit(field.id, {
            options: {
              ...field.options,
              autoSearchConfig: null,
            },
          });
        } catch {}
      }
    }
  };

  return (
    <>
      {providers.length > 1 ? (
        <HStack spacing={4}>
          <Text textStyle={isReadOnly ? "muted" : undefined}>
            <FormattedMessage
              id="component.petition-compose-background-check-settings.provider"
              defaultMessage="Provider"
            />
          </Text>
          <Box flex="1" minWidth="0">
            <SimpleSelect
              data-testid="petition-compose-background-check-provider-select"
              size="sm"
              isDisabled={isDisabled}
              options={providers}
              value={options.integrationId as any}
              onChange={(provider) => {
                onFieldEdit(field.id, {
                  options: {
                    ...field.options,
                    provider,
                  },
                });
              }}
              placeholder={intl.formatMessage({
                id: "component.petition-compose-background-check-settings.provider-placeholder",
                defaultMessage: "No provider",
              })}
            />
          </Box>
        </HStack>
      ) : null}
      <SettingsRowButton
        data-section="automate-search"
        isDisabled={isDisabled}
        label={
          <HStack>
            <Text as="span">
              <FormattedMessage
                id="component.petition-compose-background-check-settings.automate-search"
                defaultMessage="Automate the search"
              />
            </Text>
            <HelpPopover popoverWidth="2xs">
              <FormattedMessage
                id="component.petition-compose-background-check-settings.automate-search-help"
                defaultMessage="Add this option to automate the search using replies from the fields."
              />
            </HelpPopover>
          </HStack>
        }
        isActive={isDefined(options.autoSearchConfig)}
        onAdd={() => handleAutomateSearchChange()}
        onRemove={() => handleAutomateSearchChange(true)}
        onConfig={() => handleAutomateSearchChange()}
        controlId="automate-search"
      />
    </>
  );
}

PetitionComposeBackgroundCheckSettings.fragments = {
  PetitionField: gql`
    fragment PetitionComposeBackgroundCheckSettings_PetitionField on PetitionField {
      id
      petition {
        id
        organization {
          id
        }
        fields {
          id
          ...ConfigureAutomateSearchDialog_PetitionField
          children {
            id
            ...ConfigureAutomateSearchDialog_PetitionField
          }
        }
      }
      ...ConfigureAutomateSearchDialog_PetitionField
    }
    ${ConfigureAutomateSearchDialog.fragments.PetitionField}
  `,
};

const _mutations = [
  gql`
    mutation PetitionComposeBackgroundCheckSettings_updatePetitionFieldAutoSearchConfig(
      $petitionId: GID!
      $fieldId: GID!
      $config: UpdatePetitionFieldAutoSearchConfigInput
    ) {
      updatePetitionFieldAutoSearchConfig(
        petitionId: $petitionId
        fieldId: $fieldId
        config: $config
      ) {
        id
        options
      }
    }
  `,
];
