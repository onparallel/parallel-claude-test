import { Box, Stack } from "@chakra-ui/react";
import { RefAttributes, useMemo } from "react";
import { useIntl } from "react-intl";
import { CSSObjectWithLabel, OptionProps, SingleValueProps, components } from "react-select";
import {
  SimpleOption,
  SimpleSelect,
  SimpleSelectInstance,
  SimpleSelectProps,
} from "./SimpleSelect";
import { Text } from "@parallel/components/ui";

export const DEFAULT_COLORS = [
  "#E2E8F0",
  "#F5EFE8",
  "#FEEBC8",
  "#FED7D7",
  "#DDDCF8",
  "#CEEDFF",
  "#D5E7DE",
];

function useTagColors() {
  const intl = useIntl();
  return useMemo<SimpleOption[]>(
    () => [
      {
        label: intl.formatMessage({
          id: "generic.color.gray",
          defaultMessage: "gray",
        }),
        value: "#E2E8F0",
      },
      {
        label: intl.formatMessage({
          id: "generic.color.brown",
          defaultMessage: "brown",
        }),
        value: "#F5EFE8",
      },
      {
        label: intl.formatMessage({
          id: "generic.color.yellow",
          defaultMessage: "yellow",
        }),
        value: "#FEEBC8",
      },
      {
        label: intl.formatMessage({
          id: "generic.color.red",
          defaultMessage: "red",
        }),
        value: "#FED7D7",
      },
      {
        label: intl.formatMessage({
          id: "generic.color.purple",
          defaultMessage: "purple",
        }),
        value: "#DDDCF8",
      },
      {
        label: intl.formatMessage({
          id: "generic.color.blue",
          defaultMessage: "blue",
        }),
        value: "#CEEDFF",
      },
      {
        label: intl.formatMessage({
          id: "generic.color.green",
          defaultMessage: "green",
        }),
        value: "#D5E7DE",
      },
    ],

    [intl.locale],
  );
}

export type TagColorSelectProps = Omit<
  SimpleSelectProps<string>,
  "options" | "components" | "styles"
>;

export function TagColorSelect(
  props: TagColorSelectProps & RefAttributes<SimpleSelectInstance<string, false>>,
) {
  const options = useTagColors();
  return (
    <SimpleSelect
      options={options}
      components={{ SingleValue, Option } as any}
      styles={{
        valueContainer: (styles: CSSObjectWithLabel) => ({
          ...styles,
          flexWrap: "nowrap",
        }),
        option: (styles: CSSObjectWithLabel) => ({
          ...styles,
          display: "flex",
          padding: "0.25rem 1rem",
        }),
      }}
      {...props}
    />
  );
}

function TagColorOption({ color }: { color: SimpleOption }) {
  return (
    <Stack direction="row" alignItems="center">
      <Box boxSize={4} backgroundColor={color.value} borderRadius="sm" />
      <Text as="div" textTransform="capitalize">
        {color.label}
      </Text>
    </Stack>
  );
}

function SingleValue(props: SingleValueProps<SimpleOption<string>>) {
  return (
    <components.SingleValue {...props}>
      <TagColorOption color={props.data} />
    </components.SingleValue>
  );
}

function Option(props: OptionProps<SimpleOption<string>>) {
  return (
    <components.Option {...props}>
      <TagColorOption color={props.data} />
    </components.Option>
  );
}
