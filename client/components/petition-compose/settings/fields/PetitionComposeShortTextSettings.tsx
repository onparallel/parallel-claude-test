import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { ShortTextFormatSelect } from "@parallel/components/common/ShortTextFormatSelect";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useShortTextFormatsSelectOptions } from "@parallel/utils/useShortTextFormats";
import { FormattedMessage } from "react-intl";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";

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
      <Stack>
        <HStack spacing={4}>
          <Text textStyle={isReadOnly ? "muted" : undefined}>
            <FormattedMessage
              id="component.petition-compose-text-settings.format"
              defaultMessage="Format:"
            />
          </Text>
          <Box flex="1" minWidth="0">
            <ShortTextFormatSelect
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
        </HStack>
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
