import { Box, Stack, Text } from "@chakra-ui/layout";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import Select, { components, Props as SelectProps } from "react-select";

export const DEFAULT_COLORS = [
  "#E2E8F0",
  "#F5EFE8",
  "#FEEBC8",
  "#FED7D7",
  "#DDDCF8",
  "#CEEDFF",
  "#D5E7DE",
];

type TagColor = {
  name: string;
  value: string;
};

function useTagColors() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        name: intl.formatMessage({
          id: "generic.color.gray",
          defaultMessage: "gray",
        }),
        value: "#E2E8F0",
      },
      {
        name: intl.formatMessage({
          id: "generic.color.brown",
          defaultMessage: "brown",
        }),
        value: "#F5EFE8",
      },
      {
        name: intl.formatMessage({
          id: "generic.color.yellow",
          defaultMessage: "yellow",
        }),
        value: "#FEEBC8",
      },
      {
        name: intl.formatMessage({
          id: "generic.color.red",
          defaultMessage: "red",
        }),
        value: "#FED7D7",
      },
      {
        name: intl.formatMessage({
          id: "generic.color.purple",
          defaultMessage: "purple",
        }),
        value: "#DDDCF8",
      },
      {
        name: intl.formatMessage({
          id: "generic.color.blue",
          defaultMessage: "blue",
        }),
        value: "#CEEDFF",
      },
      {
        name: intl.formatMessage({
          id: "generic.color.green",
          defaultMessage: "green",
        }),
        value: "#D5E7DE",
      },
    ],
    [intl.locale]
  );
}

export type TagColorSelectProps = Omit<
  SelectProps<TagColor, false, never>,
  "value" | "onChange" | "options"
> &
  ValueProps<string>;

export function TagColorSelect({
  value,
  onChange,
  ...props
}: TagColorSelectProps) {
  const options = useTagColors();
  const _value = options.find((o) => o.value === value) ?? null;
  const rsProps = useReactSelectProps<TagColor, false, never>({
    components: {
      SingleValue: (props) => {
        return <TagColorOption color={props.data} />;
      },
      Option: (props) => {
        return (
          <components.Option {...props}>
            <TagColorOption color={props.data} />
          </components.Option>
        );
      },
    },
    styles: {
      valueContainer: (styles) => ({
        ...styles,
        flexWrap: "nowrap",
      }),
      option: (styles, { isFocused, theme }) => ({
        ...styles,
        display: "flex",
        padding: "0.25rem 1rem",
        // backgroundColor: isFocused ? theme.colors.neutral5 : undefined,
      }),
    },
  });
  function handleChange(color: TagColor | null) {
    onChange(color?.value ?? null);
  }

  return (
    <Select
      {...rsProps}
      options={options}
      getOptionValue={(o) => o.value}
      getOptionLabel={(o) => o.name}
      value={_value}
      onChange={handleChange}
      {...props}
    />
  );
}

function TagColorOption({ color }: { color: TagColor }) {
  return (
    <Stack direction="row" alignItems="center">
      <Box boxSize={4} backgroundColor={color.value} borderRadius="sm" />
      <Text as="div" textTransform="capitalize">
        {color.name}
      </Text>
    </Stack>
  );
}
