import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { isDefined, pick } from "remeda";
import { PetitionComposeFieldSettingsProps } from "./PetitionComposeFieldSettings";

export function NumberSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const options = field.options as FieldOptions["NUMBER"];
  const [range, setRange] = useState(options.range);

  const handleMinChange = (value: number | undefined) => {
    setRange((r) => ({ ...r, min: value }));
  };

  const handleMaxChange = (value: number | undefined) => {
    setRange((r) => ({ ...r, max: value }));
  };

  const handleBlur = () => {
    onFieldEdit(field.id, {
      options: {
        ...field.options,
        range,
      },
    });
  };

  const isInvalid = isDefined(range.min) && isDefined(range.max) && range.min > range.max;

  return (
    <FormControl isInvalid={isInvalid}>
      <Text display="flex" alignItems="center" fontWeight="normal" marginBottom={2}>
        <FormattedMessage
          id="component.field-settings-number.limit-range"
          defaultMessage="Limit value range"
        />
        <HelpPopover>
          {
            <FormattedMessage
              id="component.field-settings-number.add-range-description"
              defaultMessage="Limit the value range of the recipient's responses."
            />
          }
        </HelpPopover>
      </Text>
      <Stack
        spacing={{ base: 4, md: 2, lg: 4 }}
        direction={{ base: "row", md: "column", lg: "row" }}
      >
        <FormControl
          flex={1}
          as={HStack}
          alignItems="center"
          isDisabled={isReadOnly}
          isInvalid={isInvalid}
        >
          <FormLabel margin={0} fontSize="sm">
            <FormattedMessage
              id="component.field-settings-number.range-minimum"
              defaultMessage="Minimum:"
            />
          </FormLabel>
          <Box flex="1">
            <NumeralInput
              size="sm"
              value={range.min}
              onChange={handleMinChange}
              onBlur={handleBlur}
              width="100%"
              placeholder="-∞"
            />
          </Box>
        </FormControl>
        <FormControl
          flex="1"
          as={HStack}
          alignItems="center"
          isDisabled={isReadOnly}
          isInvalid={isInvalid}
        >
          <FormLabel margin={0} fontSize="sm">
            <FormattedMessage
              id="component.field-settings-number.range-maximum"
              defaultMessage="Maximum:"
            />
          </FormLabel>
          <Box flex="1">
            <NumeralInput
              size="sm"
              value={range.max}
              onChange={handleMaxChange}
              onBlur={handleBlur}
              width="100%"
              placeholder="∞"
            />
          </Box>
        </FormControl>
      </Stack>
      <FormErrorMessage>
        <FormattedMessage
          id="component.field-settings-number.range-error"
          defaultMessage="Maximum can not be lower than minimum."
        />
      </FormErrorMessage>
    </FormControl>
  );
}
