import { Box, CloseButton, Text, useTheme } from "@chakra-ui/core";
import { ChevronDownIcon, SmallCloseIcon } from "@parallel/chakra/icons";
import { memo, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  components,
  OptionTypeBase,
  Props as SelectProps,
  Theme,
} from "react-select";

export const SIZES = {
  lg: {
    spacing: {
      controlHeight: 48,
      menuGutter: 8,
      baseUnit: 4,
    },
    paddingX: 4,
    borderRadius: "md" as const,
    multiValue: {
      borderRadius: "sm" as const,
    },
  },
  md: {
    spacing: {
      controlHeight: 40,
      menuGutter: 8,
      baseUnit: 4,
    },
    paddingX: 4,
    borderRadius: "md" as const,
    multiValue: {
      borderRadius: "sm" as const,
    },
  },
  sm: {
    spacing: {
      controlHeight: 32,
      menuGutter: 8,
      baseUnit: 4,
    },
    paddingX: 3,
    borderRadius: "sm" as const,
    multiValue: {
      borderRadius: "sm" as const,
    },
  },
};

export type UserReactSelectStyleProps = {
  size?: keyof typeof SIZES;
  isInvalid?: boolean;
};
/**
 * Generates the props necessary for styling react-select as a chakra component
 */
export function useReactSelectStyle<
  OptionType extends OptionTypeBase = { label: string; value: string }
>({ size = "md", isInvalid = false }: UserReactSelectStyleProps) {
  const { colors, radii, sizes } = useTheme();
  const intl = useIntl();
  const labels = useMemo(
    () => ({
      clear: intl.formatMessage({
        id: "generic.clear",
        defaultMessage: "Clear",
      }),
    }),
    [intl.locale]
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
          borderRadius: radii[SIZES[size].borderRadius] as any,
        } as Theme),
      components: {
        IndicatorSeparator: memo(() => <></>),
        ClearIndicator: memo(({ innerProps }) => (
          <CloseButton
            tabIndex={-1}
            title={labels.clear}
            aria-label={labels.clear}
            size="sm"
            {...innerProps}
          />
        )),
        DropdownIndicator: memo(({ isFocused }) => (
          <Box
            paddingX={2}
            color={isFocused ? "gray.600" : "gray.300"}
            _hover={{
              color: "gray.600",
            }}
          >
            <ChevronDownIcon display="block" />
          </Box>
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
        MultiValueRemove: memo(({ innerProps, ...props }) => {
          const intl = useIntl();
          return (
            <components.MultiValueRemove
              innerProps={{
                ...innerProps,
                role: "button",
                "aria-label": intl.formatMessage({
                  id: "generic.remove",
                  defaultMessage: "Remove",
                }),
              }}
            >
              <SmallCloseIcon boxSize="18px" />
            </components.MultiValueRemove>
          );
        }),
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
              : isInvalid
              ? colors.red[500]
              : isFocused
              ? colors.blue[500]
              : "inherit",
            boxShadow: isInvalid
              ? `0 0 0 1px ${colors.red[500]}`
              : isFocused
              ? `0 0 0 1px ${colors.blue[500]}`
              : undefined,
            "&:hover": {
              borderColor: isInvalid
                ? colors.red[500]
                : isFocused
                ? theme.colors.primary
                : colors.gray[300],
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
          borderRadius: radii[SIZES[size].multiValue.borderRadius],
        }),
        multiValueRemove: (styles, { theme }) => {
          const radius = radii[SIZES[size].multiValue.borderRadius];
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
    [size, isInvalid]
  );
}
