import { Box, Stack, Text } from "@chakra-ui/react";
import { genericRsComponent, rsStyles } from "@parallel/utils/react-select/hooks";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { components } from "react-select";
import { SimpleOption, SimpleSelect } from "./SimpleSelect";

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
          defaultMessage: "primary",
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
    [intl.locale]
  );
}

export type TagColorSelectProps = ValueProps<string>;

export function TagColorSelect({ value, onChange }: TagColorSelectProps) {
  const options = useTagColors();
  const styles = rsStyles<SimpleOption, false>({
    valueContainer: (styles) => ({
      ...styles,
      flexWrap: "nowrap",
    }),
    option: (styles) => ({
      ...styles,
      display: "flex",
      padding: "0.25rem 1rem",
    }),
  });

  return (
    <SimpleSelect
      options={options}
      components={{ SingleValue, Option }}
      styles={styles}
      value={value}
      onChange={onChange}
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

const rsComponent = genericRsComponent<SimpleOption, false>();

const SingleValue = rsComponent("SingleValue", function (props) {
  return (
    <components.SingleValue {...props}>
      <TagColorOption color={props.data} />
    </components.SingleValue>
  );
});

const Option = rsComponent("Option", function (props) {
  return (
    <components.Option {...props}>
      <TagColorOption color={props.data} />
    </components.Option>
  );
});
