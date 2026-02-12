import { gql } from "@apollo/client";

import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import { HStack, Text } from "@parallel/components/ui";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { useConfigureAdverseMediaAutomateSearchDialog } from "../../dialogs/ConfigureAdverseMediaAutomateSearchDialog";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { SettingsRowButton } from "../rows/SettingsRowButton";

export function PetitionComposeAdverseMediaSearchSettings({
  petition,
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "petition" | "field" | "onFieldEdit" | "isReadOnly">) {
  const options = field.options as FieldOptions["ADVERSE_MEDIA_SEARCH"];
  const isDisabled = isReadOnly || field.isFixed;
  const petitionId = petition.id;
  const showAutomateSearchDialog = useConfigureAdverseMediaAutomateSearchDialog();

  const handleAutomateSearchChange = async (remove?: boolean) => {
    try {
      if (remove) {
        onFieldEdit(field.id, {
          options: {
            autoSearchConfig: null,
          },
        });
      } else {
        const config = await showAutomateSearchDialog({
          petitionId,
          field,
        });

        await onFieldEdit(field.id, {
          options: {
            autoSearchConfig: config,
          },
        });
      }
    } catch (e) {
      if (isDialogError(e) && e.reason === "DELETE_AUTO_SEARCH_CONFIG") {
        try {
          onFieldEdit(field.id, {
            options: {
              autoSearchConfig: null,
            },
          });
        } catch {}
      }
    }
  };

  return (
    <SettingsRowButton
      data-section="automate-search"
      isDisabled={isDisabled}
      label={
        <HStack>
          <Text as="span">
            <FormattedMessage
              id="component.petition-compose-adverse-media-search-settings.autocomplete-search"
              defaultMessage="Autocomplete the search"
            />
          </Text>
          <HelpPopover popoverWidth="2xs">
            <FormattedMessage
              id="component.petition-compose-adverse-media-search-settings.autocomplete-search-help"
              defaultMessage="Add this option to autocomplete the search using replies from the fields."
            />
          </HelpPopover>
        </HStack>
      }
      isActive={isNonNullish(options.autoSearchConfig)}
      onAdd={() => handleAutomateSearchChange()}
      onRemove={() => handleAutomateSearchChange(true)}
      onConfig={() => handleAutomateSearchChange()}
      controlId="automate-search"
    />
  );
}

const _fragments = {
  PetitionField: gql`
    fragment PetitionComposeAdverseMediaSearchSettings_PetitionField on PetitionField {
      id
      options
    }
  `,
};
