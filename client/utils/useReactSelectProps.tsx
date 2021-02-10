import {
  Center,
  CloseButton,
  Text,
  useFormControl,
  useTheme,
} from "@chakra-ui/react";
import { ChevronDownIcon, CloseIcon } from "@parallel/chakra/icons";
import React, { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  components,
  GroupTypeBase,
  OptionTypeBase,
  Props,
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
    paddingX: 2,
    borderRadius: "md" as const,
    multiValue: {
      borderRadius: "sm" as const,
    },
  },
};

export type UseReactSelectProps = {
  size?: keyof typeof SIZES;
  id?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
};

export interface SelectProps<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = any,
  GroupType extends GroupTypeBase<OptionType> = GroupTypeBase<OptionType>
> extends Props<OptionType, IsMulti, GroupType> {}

/**
 * Generates the props necessary for styling react-select as a chakra component
 */
export function useReactSelectProps<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = any,
  GroupType extends GroupTypeBase<OptionType> = GroupTypeBase<OptionType>
>({
  size = "md",
  ...props
}: UseReactSelectProps): SelectProps<OptionType, IsMulti, GroupType> {
  const intl = useIntl();
  const { colors, radii, sizes } = useTheme();

  const {
    id: inputId,
    "aria-invalid": isInvalid,
    disabled: isDisabled,
  } = useFormControl(props);

  const labels = useMemo(
    () => ({
      clear: intl.formatMessage({
        id: "generic.clear",
        defaultMessage: "Clear",
      }),
    }),
    [intl.locale]
  );
  return useMemo<SelectProps<OptionType, IsMulti, GroupType>>(
    () => ({
      inputId,
      isDisabled,
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
        IndicatorSeparator: () => null,
        ClearIndicator: ({ innerProps }) => (
          <CloseButton
            tabIndex={-1}
            title={labels.clear}
            aria-label={labels.clear}
            size="sm"
            {...innerProps}
          />
        ),
        DropdownIndicator: () => (
          <Center
            width={SIZES[size].spacing.controlHeight + "px"}
            color="gray.600"
          >
            <ChevronDownIcon display="block" position="relative" top="1px" />
          </Center>
        ),
        NoOptionsMessage: () => (
          <Text as="div" textStyle="hint" textAlign="center" paddingY={2}>
            <FormattedMessage
              id="component.react-select.no-options"
              defaultMessage="No options"
            />
          </Text>
        ),
        MultiValueRemove: ({ innerProps, ...props }) => {
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
              {...props}
            >
              <CloseIcon boxSize="10px" marginX={1} />
            </components.MultiValueRemove>
          );
        },
        LoadingMessage: () => (
          <Text as="div" color="gray.400" textAlign="center" paddingY={2}>
            <FormattedMessage
              id="component.react-select.loading"
              defaultMessage="Loading..."
            />
          </Text>
        ),
      },
      styles: {
        container: (styles, { isDisabled }) => ({
          ...styles,
          cursor: isDisabled ? "not-allowed" : "default",
          pointerEvents: undefined,
        }),
        input: (styles) => ({
          ...styles,
          margin: "0 2px",
        }),
        control: (styles, { isDisabled, isFocused, theme }: any) => {
          return {
            ...styles,
            alignItems: "stretch",
            opacity: isDisabled ? 0.4 : 1,
            borderColor: isInvalid
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
            pointerEvents: isDisabled ? "none" : undefined,
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
        singleValue: (styles, props) => ({
          ...styles,
          color: "unset",
        }),
        multiValue: (styles, { data }) => ({
          ...styles,
          backgroundColor: data.isInvalid ? colors.red[200] : colors.gray[200],
          borderRadius: radii[SIZES[size].multiValue.borderRadius],
        }),
        multiValueRemove: (styles, { data }) => {
          const radius = radii[SIZES[size].multiValue.borderRadius];
          return {
            ...styles,
            borderRadius: `0 ${radius} ${radius} 0`,
            ":hover": {
              backgroundColor: data.isInvalid
                ? colors.red[300]
                : colors.gray[300],
              color: colors.gray[900],
            },
          };
        },
        multiValueLabel: (styles) => ({
          ...styles,
          display: "inline-flex",
          alignItems: "center",
        }),
      },
    }),
    [size, inputId, isInvalid, isDisabled]
  );
}
