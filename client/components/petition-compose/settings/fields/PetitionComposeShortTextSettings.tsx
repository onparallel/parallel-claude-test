import { gql } from "@apollo/client";
import { Box, Stack, Text } from "@chakra-ui/react";
import { ShortTextFormatSelect } from "@parallel/components/common/ShortTextFormatSelect";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { useShortTextFormatsSelectOptions } from "@parallel/utils/useShortTextFormats";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { SettingsRow } from "../rows/SettingsRow";

export function PetitionComposeShortTextSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const options = field.options as FieldOptions["SHORT_TEXT"];

  const { allFormats } = useShortTextFormatsSelectOptions();
  const selected = allFormats.find((o) => o.value === options.format);

  return (
    <>
      <Stack spacing={1}>
        <SettingsRow
          controlId="short-text-format"
          textStyle={isReadOnly ? "muted" : undefined}
          label={
            <FormattedMessage
              id="component.petition-compose-text-settings.format"
              defaultMessage="Format"
            />
          }
          isDisabled={isNonNullish(field.profileTypeField?.options?.format) || isReadOnly}
        >
          <Box flex={1}>
            <ShortTextFormatSelect
              isDisabled={isNonNullish(field.profileTypeField?.options?.format) || isReadOnly}
              size="sm"
              data-testid="petition-compose-short-text-format-select"
              value={options.format}
              onChange={(format) => {
                onFieldEdit(field.id, {
                  options: {
                    ...field.options,
                    format,
                  },
                });
              }}
            />
          </Box>
        </SettingsRow>
        {selected ? (
          <Text fontSize="sm" color="gray.500">
            <FormattedMessage
              id="generic.example"
              defaultMessage="Example: {example}"
              values={{ example: selected.example }}
            />
          </Text>
        ) : null}
      </Stack>
    </>
  );
}

const _fragments = {
  PetitionField: gql`
    fragment PetitionComposeShortTextSettings_PetitionField on PetitionField {
      id
      options
      profileTypeField {
        options
      }
    }
  `,
};
