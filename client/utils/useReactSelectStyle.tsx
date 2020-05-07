import { Icon, IconButton, PseudoBox, Text, useTheme } from "@chakra-ui/core";
import { memo, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  OptionTypeBase,
  Props as SelectProps,
  Theme,
  components,
} from "react-select";

export const SIZES = {
  lg: {
    spacing: {
      controlHeight: 48,
      menuGutter: 8,
      baseUnit: 4,
    },
    paddingX: 4,
    rounded: "md" as const,
    multiValue: {
      rounded: "sm" as const,
    },
  },
  md: {
    spacing: {
      controlHeight: 40,
      menuGutter: 8,
      baseUnit: 4,
    },
    paddingX: 4,
    rounded: "md" as const,
    multiValue: {
      rounded: "sm" as const,
    },
  },
  sm: {
    spacing: {
      controlHeight: 32,
      menuGutter: 8,
      baseUnit: 4,
    },
    paddingX: 3,
    rounded: "sm" as const,
    multiValue: {
      rounded: "sm" as const,
    },
  },
};

/**
 * Generates the props necessary for styling react-select as a chakra component
 */
export function useReactSelectStyle<
  OptionType extends OptionTypeBase = { label: string; value: string }
>({ size }: { size: keyof typeof SIZES } = { size: "md" }) {
  const { colors, radii, sizes } = useTheme();
  const intl = useIntl();
  const labels = useMemo(
    () => ({
      clear: intl.formatMessage({
        id: "component.input.clear-button",
        defaultMessage: "Clear",
      }),
    }),
    []
  );
  return useMemo<SelectProps<OptionType>>(
    () => ({
      theme: (theme: Theme) =>
        ({
          spacing: SIZES[size].spacing,
          colors: {
            ...theme.colors,
            primary: colors.blue[500],
            primary25: colors.gray[100],
            neutral0: colors.white,
            neutral5: colors.gray[50],
            neutral10: colors.gray[100],
            neutral20: colors.gray[200],
            neutral30: colors.gray[300],
            neutral40: colors.gray[400],
            neutral50: colors.gray[500],
            neutral60: colors.gray[600],
            neutral70: colors.gray[700],
            neutral80: colors.gray[800],
            neutral90: colors.gray[900],
          },
          borderRadius: radii[SIZES[size].rounded] as any,
        } as Theme),
      components: {
        IndicatorSeparator: memo(() => <></>),
        ClearIndicator: memo(({ innerProps }) => (
          <IconButton
            tabIndex={-1}
            title={labels.clear}
            aria-label={labels.clear}
            icon="close"
            size="xs"
            variant="ghost"
            {...innerProps}
          ></IconButton>
        )),
        DropdownIndicator: memo(({ isFocused }) => (
          <PseudoBox
            paddingX={2}
            color={isFocused ? "gray.600" : "gray.300"}
            _hover={{
              color: "gray.600",
            }}
          >
            <Icon display="block" name="chevron-down" />
          </PseudoBox>
        )),
        NoOptionsMessage: memo(() => (
          <Text
            as="div"
            fontStyle="italic"
            color="gray.400"
            textAlign="center"
            paddingY={2}
          >
            <FormattedMessage
              id="component.react-select.no-options"
              defaultMessage="No options"
            />
          </Text>
        )),
        MultiValueRemove: memo(({ innerProps }) => (
          <components.MultiValueRemove innerProps={innerProps}>
            <Icon name="small-close" size="18px" />
          </components.MultiValueRemove>
        )),
        LoadingMessage: memo(() => (
          <Text as="div" color="gray.400" textAlign="center" paddingY={2}>
            <FormattedMessage
              id="component.react-select.loading"
              defaultMessage="Loading..."
            />
          </Text>
        )),
      },
      styles: {
        control: (styles, { isDisabled, isFocused, theme }) => {
          return {
            ...styles,
            borderColor: isDisabled
              ? colors.gray[100]
              : isFocused
              ? colors.blue[500]
              : "inherit",
            "&:hover": {
              borderColor: isFocused ? theme.colors.primary : colors.gray[300],
            },
          };
        },
        placeholder: (styles) => ({
          ...styles,
          color: colors.gray[400],
        }),
        valueContainer: (styles) => ({
          ...styles,
          paddingLeft: (sizes as any)[SIZES[size].paddingX],
        }),
        option: (styles) => ({
          ...styles,
          cursor: "pointer",
          padding: "0 1rem",
          minHeight: "32px",
          display: "flex",
          alignItems: "center",
        }),
        menuList: (styles) => ({
          ...styles,
          padding: "0.5rem 0",
        }),
        multiValue: (styles) => ({
          ...styles,
          backgroundColor: colors.gray[200],
          borderRadius: radii[SIZES[size].multiValue.rounded],
        }),
        multiValueRemove: (styles, { theme }) => {
          const radius = radii[SIZES[size].multiValue.rounded];
          return {
            ...styles,
            borderRadius: `0 ${radius} ${radius} 0`,
            ":hover": {
              backgroundColor: colors.gray[300],
              color: colors.gray[900],
            },
          };
        },
      },
    }),
    []
  );
}
