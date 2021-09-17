import { Box, CloseButton, Flex, Text, useFormControl, useTheme } from "@chakra-ui/react";
import { ChevronDownIcon, CloseIcon } from "@parallel/chakra/icons";
import { useRehydrated } from "@parallel/utils/useRehydrated";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  CommonProps,
  components,
  GroupTypeBase,
  IndicatorProps,
  OptionTypeBase,
  SelectComponentsConfig,
  StylesConfig,
  Theme,
} from "react-select";
import { omit } from "remeda";
import { OptionType, SelectProps } from "./types";

export const SIZES = {
  lg: {
    spacing: {
      controlHeight: 48,
      menuGutter: 8,
      baseUnit: 4,
      padding: 16,
    },
    fontSize: "md" as const,
    borderRadius: "md" as const,
  },
  md: {
    spacing: {
      controlHeight: 40,
      menuGutter: 8,
      baseUnit: 4,
      padding: 16,
    },
    fontSize: "md" as const,
    borderRadius: "md" as const,
  },
  sm: {
    spacing: {
      controlHeight: 32,
      menuGutter: 8,
      baseUnit: 4,
      padding: 8,
    },
    fontSize: "sm" as const,
    borderRadius: "md" as const,
  },
};

export type UseReactSelectProps = {
  size?: keyof typeof SIZES;
  id?: string;
  isDisabled?: boolean;
  placeholder?: string;
  isInvalid?: boolean;
  styles?: StylesConfig<any, any, any>;
  components?: SelectComponentsConfig<any, any, any>;
  usePortal?: boolean;
};

/**
 * Generates the props necessary for styling react-select as a chakra component
 */
export function useReactSelectProps<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = any,
  GroupType extends GroupTypeBase<OptionType> = never
>({ size = "md", placeholder, usePortal = true, ...props }: UseReactSelectProps = {}): SelectProps<
  OptionType,
  IsMulti,
  GroupType
> {
  const { colors, radii, fontSizes } = useTheme();

  const { id: inputId, "aria-invalid": isInvalid, disabled: isDisabled } = useFormControl(props);

  const theme = useCallback(
    (theme: Theme) => {
      return {
        spacing: SIZES[size].spacing,
        colors: {
          ...theme.colors,
          primary: colors.blue[500],
          primary25: colors.gray[75],
          error: colors.red[500],
          error10: colors.red[100],
          error20: colors.red[200],
          error30: colors.red[300],
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
        borderRadius: radii[SIZES[size].borderRadius] as number,
        fontSize: fontSizes[SIZES[size].fontSize] as string,
      } as Theme;
    },
    [size, colors]
  );

  const styles = useMemo<StylesConfig<OptionType, IsMulti, GroupType>>(
    () => ({
      menuPortal: (styles) => ({
        ...styles,
        zIndex: 40,
      }),
      container: (styles, { isDisabled }) => ({
        ...styles,
        cursor: isDisabled ? "not-allowed" : "default",
        pointerEvents: undefined,
      }),
      input: (styles) => ({
        ...styles,
        margin: "0 2px",
      }),
      control: (styles, { isDisabled, isFocused, theme, selectProps }) => {
        const isInvalid = selectProps.isInvalid as boolean;
        const {
          colors: { error, primary: borderColor, neutral30: borderColorHover },
          fontSize,
        } = theme as Theme & ThemeExtension;
        return {
          ...styles,
          alignItems: "stretch",
          opacity: isDisabled ? 0.4 : 1,
          borderColor: isInvalid ? error : isFocused ? borderColor : "inherit",
          boxShadow: isInvalid
            ? `0 0 0 1px ${error}`
            : isFocused
            ? `0 0 0 1px ${borderColor}`
            : undefined,
          "&:hover": {
            borderColor: isInvalid ? error : isFocused ? borderColor : borderColorHover,
          },
          pointerEvents: isDisabled ? "none" : undefined,
          fontSize: fontSize,
        };
      },
      placeholder: (styles, { theme }) => {
        const {
          colors: { neutral40: placeholderColor },
        } = theme;
        return {
          ...styles,
          color: placeholderColor,
          whiteSpace: "nowrap",
        };
      },
      valueContainer: (styles, { theme }) => {
        const {
          spacing: { padding },
        } = theme as Theme & ThemeExtension;
        return {
          ...omit(styles, ["padding"]),
          paddingLeft: padding,
          paddingRight: 0,
        };
      },
      option: (styles, { theme }) => {
        const {
          fontSize,
          spacing: { padding },
        } = theme as Theme & ThemeExtension;
        return {
          ...styles,
          cursor: "pointer",
          padding: `0 ${padding}px`,
          minHeight: "32px",
          display: "flex",
          alignItems: "center",
          fontSize: fontSize,
          whiteSpace: "nowrap",
        };
      },
      menu: (styles) => {
        return {
          ...styles,
          overflow: "hidden", // when using OptimizedMenuList this is needed
        };
      },
      menuList: (styles) => {
        return {
          ...styles,
          padding: "0.5rem 0",
        };
      },
      singleValue: (styles) => {
        return { ...omit(styles, ["color"]) };
      },
      multiValue: (styles, { data, theme }) => {
        const {
          colors: { neutral20: backgroundColor, error20: backgroundColorError },
        } = theme;
        return {
          ...styles,
          backgroundColor: data.isInvalid ? backgroundColorError : backgroundColor,
          borderRadius: radii["sm"],
        };
      },
      multiValueRemove: (styles, { data, theme }) => {
        const {
          colors: {
            neutral30: backgroundColorHover,
            error30: backgroundColorHoverError,
            neutral90: fontColor,
          },
        } = theme;
        return {
          ...styles,
          borderRadius: `0 ${radii["sm"]} ${radii["sm"]} 0`,
          ":hover": {
            backgroundColor: data.isInvalid ? backgroundColorHoverError : backgroundColorHover,
            color: fontColor,
          },
        };
      },
      multiValueLabel: (styles) => {
        return {
          ...styles,
          display: "inline-flex",
          alignItems: "center",
        };
      },
      ...props.styles,
    }),
    [props.styles]
  );

  const components = useMemo<SelectComponentsConfig<OptionType, IsMulti, GroupType>>(
    () => ({
      IndicatorSeparator,
      ClearIndicator,
      DropdownIndicator,
      NoOptionsMessage,
      MultiValueRemove,
      LoadingMessage,
      Option,
      ...props.components,
    }),
    [props.components]
  );

  const rehydrated = useRehydrated();
  return {
    placeholder,
    inputId,
    isDisabled,
    menuPortalTarget: usePortal && rehydrated ? document.body : undefined,
    menuPlacement: "auto",
    theme,
    components,
    styles,
    // Extension props
    size,
    isInvalid,
  };
}

export function useInlineReactSelectProps<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = any,
  GroupType extends GroupTypeBase<OptionType> = never
>(props: UseReactSelectProps): SelectProps<OptionType, IsMulti, GroupType> {
  const rsProps = useReactSelectProps<OptionType, IsMulti, GroupType>(props);
  const styles = useMemo<StylesConfig<OptionType, IsMulti, GroupType>>(
    () => ({
      ...rsProps.styles,
      control: (styles, data) =>
        omit(rsProps.styles?.control?.(styles, data) ?? styles, ["flexWrap"]),
      valueContainer: (styles, data) =>
        omit(rsProps.styles?.valueContainer?.(styles, data) ?? styles, ["flexWrap"]),
      singleValue: (styles, data) =>
        omit(rsProps.styles?.singleValue?.(styles, data) ?? styles, [
          "position",
          "maxWidth",
          "transform",
          "top",
        ]),
      menu: (styles, data) => ({
        ...(rsProps.styles?.menu?.(styles, data) ?? styles),
        minWidth: "100%",
        width: "unset",
        left: "50%",
        transform: "translateX(-50%)",
      }),
    }),
    [rsProps.styles]
  );

  return {
    ...rsProps,
    styles,
  };
}

export function useRecipientViewReactSelectProps(props: UseReactSelectProps) {
  const rsProps = useReactSelectProps<OptionType, false, never>(props);
  const styles = useMemo<StylesConfig<OptionType, false, never>>(
    () => ({
      ...rsProps.styles,
      menu: (styles, props) => ({
        ...(rsProps.styles!.menu?.(styles, props) ?? styles),
        zIndex: 100,
      }),
      valueContainer: (styles, props) => ({
        ...(rsProps.styles!.valueContainer?.(styles, props) ?? styles),
        paddingRight: 32,
      }),
    }),
    [rsProps.styles]
  );

  return {
    ...rsProps,
    styles,
  };
}

export type ExtendComponentProps<T = CommonProps<any, any, any>, TSelectProps = {}> = T & {
  theme: Theme & ThemeExtension;
  selectProps: TSelectProps & SelectComponentPropExtensions;
};

export type SelectComponentPropExtensions = {
  isInvalid: boolean;
  size: "sm" | "md" | "lg";
};

export type ThemeExtension = {
  spacing: {
    padding: number;
  };
  fontSize: string;
};

const IndicatorSeparator: typeof components.IndicatorSeparator = function IndicatorSeparator() {
  return <></>;
};

const ClearIndicator: typeof components.ClearIndicator = function ClearIndicator({ innerProps }) {
  const intl = useIntl();
  return (
    <CloseButton
      tabIndex={-1}
      aria-label={intl.formatMessage({
        id: "generic.clear",
        defaultMessage: "Clear",
      })}
      size="sm"
      {...innerProps}
    />
  );
};

const DropdownIndicator: typeof components.DropdownIndicator = function DropdownIndicator(props) {
  const { theme } = props as ExtendComponentProps<IndicatorProps<any, any, any>>;
  return (
    <Flex
      alignItems="center"
      paddingRight={theme.spacing.padding / 4}
      paddingLeft={theme.spacing.padding / 4 / 2}
      color="gray.600"
    >
      <ChevronDownIcon display="block" position="relative" top="1px" />
    </Flex>
  );
};

const NoOptionsMessage: typeof components.NoOptionsMessage = function NoOptionsMessage() {
  return (
    <Text as="div" textStyle="hint" textAlign="center" paddingY={2}>
      <FormattedMessage id="component.react-select.no-options" defaultMessage="No options" />
    </Text>
  );
};

const MultiValueRemove: typeof components.MultiValueRemove = function MultiValueRemove({
  innerProps,
  ...props
}) {
  const intl = useIntl();
  return (
    <components.MultiValueRemove
      innerProps={
        {
          ...innerProps,
          role: "button" as any,
          "aria-label": intl.formatMessage({
            id: "generic.remove",
            defaultMessage: "Remove",
          }),
        } as any
      }
      {...props}
    >
      <CloseIcon boxSize="10px" marginX={1} />
    </components.MultiValueRemove>
  );
};

const LoadingMessage: typeof components.LoadingMessage = function LoadingMessage() {
  return (
    <Text as="div" color="gray.400" textAlign="center" paddingY={2}>
      <FormattedMessage id="component.react-select.loading" defaultMessage="Loading..." />
    </Text>
  );
};

const Option: typeof components.Option = function Option({ children, ...props }) {
  return (
    <components.Option {...props}>
      <Box flex="1" isTruncated>
        {children}
      </Box>
    </components.Option>
  );
};
