import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Select,
  Stack,
  Text,
  Image,
} from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { SettingsRowSwitch } from "../SettingsRowSwitch";
import { PetitionComposeFieldSettingsProps } from "./PetitionComposeFieldSettings";
import { SettingsRowPlaceholder } from "./SettingsRowPlaceholder";

export function NumberSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const intl = useIntl();
  const options = field.options as FieldOptions["NUMBER"];
  const [range, setRange] = useState(options.range);
  const [decimals, setDecimals] = useState(options.decimals ?? 2);
  const [placeholder, setPlaceholder] = useState(options.placeholder ?? "");
  const [hasPrefix, setHasPrefix] = useState(
    isDefined(options.prefix) || isDefined(options.suffix) ? true : false
  );
  const [prefixOption, setPrefixOption] = useState(isDefined(options.suffix) ? "suffix" : "prefix");
  const [prefixValue, setPrefixValue] = useState(
    isDefined(options.prefix) ? options.prefix : options.suffix ?? ""
  );

  const isRangeInvalid = isDefined(range.min) && isDefined(range.max) && range.min > range.max;

  const debouncedOnUpdate = useDebouncedCallback(onFieldEdit, 300, [field.id]);

  const handlePlaceholderChange = function (event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setPlaceholder(value);
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        placeholder: value || null,
      },
    });
  };

  const handleMinChange = (value: number | undefined) => {
    setRange((r) => ({ ...r, min: value }));
  };

  const handleMaxChange = (value: number | undefined) => {
    setRange((r) => ({ ...r, max: value }));
  };

  const handleRangeBlur = () => {
    if (isRangeInvalid) return;
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        range,
      },
    });
  };

  const handleDecimalsBlur = () => {
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        decimals,
      },
    });
  };

  const handleTogglePrefix = (selected: boolean) => {
    setHasPrefix(selected);
    if (!selected && prefixValue) {
      setPrefixValue("");
      debouncedOnUpdate(field.id, {
        options: {
          ...field.options,
          prefix: null,
          suffix: null,
        },
      });
    }
  };

  const handlePrefixBlur = (option: string) => {
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        [option]: prefixValue || null,
        [option === "prefix" ? "suffix" : "prefix"]: null,
      },
    });
  };

  const handleChangePrefixOption = (e: ChangeEvent<HTMLSelectElement>) => {
    setPrefixOption(e.target.value);
    handlePrefixBlur(e.target.value);
  };

  return (
    <Stack spacing={4}>
      <FormControl as={HStack} flex={1}>
        <FormLabel margin={0}>
          <FormattedMessage
            id="component.field-settings-number.decimals"
            defaultMessage="No. of decimals allowed:"
          />
        </FormLabel>
        <Box flex="1">
          <NumeralInput
            size="sm"
            value={decimals}
            onChange={(value) => setDecimals(value ?? 0)}
            onBlur={handleDecimalsBlur}
            width="100%"
            placeholder="2"
            positiveOnly={true}
            max={12}
            decimals={0}
          />
        </Box>
      </FormControl>
      <FormControl isInvalid={isRangeInvalid}>
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
            isInvalid={isRangeInvalid}
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
                onBlur={handleRangeBlur}
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
            isInvalid={isRangeInvalid}
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
                onBlur={handleRangeBlur}
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
      <SettingsRowSwitch
        data-section="number-prefix-suffix"
        isDisabled={isReadOnly}
        label={
          <HStack>
            <Text as="span">
              <FormattedMessage
                id="component.field-settings-number.add-text-symbols"
                defaultMessage="Add text or symbols"
              />
            </Text>
            <HelpPopover popoverWidth="2xs">
              <>
                <Text fontSize="sm">
                  <FormattedMessage
                    id="component.field-settings-number.add-text-symbols-description"
                    defaultMessage="Add symbols or text that you want to appear before or after the replies:"
                  />
                </Text>
                <Image
                  marginTop={2}
                  src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/number_prefix.gif`}
                  role="presentation"
                />
              </>
            </HelpPopover>
          </HStack>
        }
        onChange={handleTogglePrefix}
        isChecked={hasPrefix}
        controlId="number-prefix-suffix"
      >
        <Stack>
          <HStack>
            <Box>
              <Select
                size="sm"
                borderRadius="md"
                value={prefixOption}
                onChange={handleChangePrefixOption}
              >
                <option value="prefix">
                  {intl.formatMessage({
                    id: "generic.before",
                    defaultMessage: "Before",
                  })}
                </option>
                <option value="suffix">
                  {intl.formatMessage({
                    id: "generic.after",
                    defaultMessage: "After",
                  })}
                </option>
              </Select>
            </Box>
            <Input
              flex="1"
              size="sm"
              placeholder="%, €, $..."
              value={prefixValue}
              onChange={(e) => setPrefixValue(e.target.value)}
              onBlur={() => handlePrefixBlur(prefixOption)}
            />
          </HStack>
          <Text fontSize="sm" color="gray.500" whiteSpace="pre">
            <FormattedMessage
              id="component.field-settings-number.add-text-symbols-example"
              defaultMessage="Example:"
            />{" "}
            {`${prefixOption === "prefix" ? prefixValue : ""}100${
              prefixOption === "suffix" ? prefixValue : ""
            }`}
          </Text>
        </Stack>
      </SettingsRowSwitch>
      <SettingsRowPlaceholder
        placeholder={placeholder}
        onChange={handlePlaceholderChange}
        isReadOnly={isReadOnly}
      />
    </Stack>
  );
}
