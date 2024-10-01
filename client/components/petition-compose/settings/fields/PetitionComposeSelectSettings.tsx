import { Box, Stack, Text } from "@chakra-ui/react";
import { StandardListSelect } from "@parallel/components/common/StandardListSelect";
import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { FormattedMessage } from "react-intl";
import { useConfirmOverwriteOptionsDialog } from "../../dialogs/ConfirmOverwriteOptionsDialog";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { ImportOptionsSettingsRow } from "../rows/ImportOptionsSettingsRow";
import { SettingsRow } from "../rows/SettingsRow";

export function PetitionComposeSelectSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "petition" | "field" | "onFieldEdit" | "isReadOnly">) {
  const showConfirmOverwriteOptionsDialog = useConfirmOverwriteOptionsDialog();

  const handleFieldEdit = async (data: UpdatePetitionFieldInput) => {
    try {
      if (options.values.length) {
        await showConfirmOverwriteOptionsDialog();
      }
      onFieldEdit(field.id, data);
    } catch {}
  };

  const options = field.options as FieldOptions["SELECT"];
  return (
    <>
      <SettingsRow
        label={
          <FormattedMessage
            id="component.petition-compose-field-settings.list-of-options-label"
            defaultMessage="List of options"
          />
        }
        description={
          <Stack>
            <Text>
              <FormattedMessage
                id="component.petition-compose-field-settings.list-of-options-description-1"
                defaultMessage="Use our existing option lists to save time."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.petition-compose-field-settings.list-of-options-description-2"
                defaultMessage="These options will be fixed and not editable."
              />
            </Text>
          </Stack>
        }
        controlId="list-of-options"
      >
        <Box flex={1}>
          <StandardListSelect
            isDisabled={field.isLinkedToProfileTypeField || isReadOnly}
            size="sm"
            isClearable
            value={options?.standardList ?? null}
            onChange={async (standardList) => {
              handleFieldEdit({
                options: { ...options, standardList, values: [], labels: null },
              });
            }}
          />
        </Box>
      </SettingsRow>
      <ImportOptionsSettingsRow
        field={field}
        onChange={handleFieldEdit}
        isDisabled={isReadOnly || field.isLinkedToProfileTypeField}
      />
    </>
  );
}
