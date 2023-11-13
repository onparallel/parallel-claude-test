import { CloseButton, Flex, Text, useFormControl, useTheme } from "@chakra-ui/react";
import { ChevronDownIcon, CloseIcon } from "@parallel/chakra/icons";
import { useRehydrated } from "@parallel/utils/useRehydrated";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  CSSObjectWithLabel,
  ClearIndicatorProps,
  ContainerProps,
  ControlProps,
  DropdownIndicatorProps,
  GroupBase,
  MultiValueProps,
  OptionProps,
  PlaceholderProps,
  Props as SelectProps,
  Theme,
  components,
  mergeStyles,
} from "react-select";
import { isDefined, omit } from "remeda";
import { OptionBase } from "./types";

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

export interface UseReactSelectProps<
  OptionType extends OptionBase = OptionBase,
  IsMulti extends boolean = any,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>,
> extends Pick<
    SelectProps<OptionType, IsMulti, GroupType>,
    "id" | "isDisabled" | "styles" | "components"
  > {
  size?: keyof typeof SIZES;
  isInvalid?: boolean;
  usePortal?: boolean;
  singleLineOptions?: boolean;
  isReadOnly?: boolean;
}

/**
 * Generates the props necessary for styling react-select as a chakra component
 */
export function useReactSelectProps<
  OptionType extends OptionBase = OptionBase,
  IsMulti extends boolean = any,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>,
>({
  size = "md",
  usePortal = true,
  styles: _styles,
  singleLineOptions,
  ...props
}: UseReactSelectProps<OptionType, IsMulti, GroupType> = {}): SelectProps<
  OptionType,
  IsMulti,
  GroupType
> {
  const { colors, radii, fontSizes } = useTheme();

  const {
    id: inputId,
    "aria-invalid": isInvalid,
    disabled: isDisabled,
    readOnly: isReadOnly,
  } = useFormControl(props);

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
    [size, colors],
  );

  const styles = useMemo(() => {
    const styles = {
      menuPortal: (styles: CSSObjectWithLabel) => omit(styles, ["zIndex"]),
      container: (styles: CSSObjectWithLabel, { isDisabled }: ContainerProps) => ({
        ...styles,
        cursor: isDisabled ? "not-allowed" : "default",
        pointerEvents: undefined,
      }),
      input: (styles: CSSObjectWithLabel) => ({
        ...styles,
        margin: "0 2px",
      }),
      control: (
        styles: CSSObjectWithLabel,
        { isDisabled, isFocused, theme, selectProps }: ControlProps & ExtendComponentProps,
      ) => {
        const { isInvalid } = selectProps;
        const {
          colors: { error, primary: borderColor, neutral30: borderColorHover },
          fontSize,
        } = theme;
        return {
          ...styles,
          alignItems: "stretch",
          backgroundColor: "white",
          opacity: isDisabled && !isReadOnly ? 0.4 : 1,
          borderColor: isInvalid ? error : isFocused ? borderColor : "inherit",
          boxShadow: isInvalid
            ? `0 0 0 1px ${error}`
            : isFocused
              ? `0 0 0 1px ${borderColor}`
              : undefined,
          pointerEvents: isDisabled || isReadOnly ? "none" : undefined,
          fontSize: fontSize,
          "&:hover": {
            borderColor: isInvalid ? error : isFocused ? borderColor : borderColorHover,
          },
        };
      },
      placeholder: (styles: CSSObjectWithLabel, { theme }: PlaceholderProps) => {
        const {
          colors: { neutral40: placeholderColor },
        } = theme;
        return {
          ...styles,
          color: placeholderColor,
          whiteSpace: "nowrap",
        };
      },
      valueContainer: (
        styles: CSSObjectWithLabel,
        { theme }: ContainerProps & ExtendComponentProps,
      ) => {
        const {
          spacing: { padding },
        } = theme;
        return {
          ...omit(styles, ["padding"]),
          paddingLeft: padding,
          paddingRight: 0,
        };
      },
      option: (
        styles: CSSObjectWithLabel,
        { theme, selectProps }: OptionProps & ExtendComponentProps,
      ) => {
        const {
          fontSize,
          spacing: { padding },
        } = theme;
        const { singleLineOptions } = selectProps;
        return {
          ...styles,
          cursor: "pointer",
          padding: `6px ${padding}px`,
          fontSize: fontSize,
          textOverflow: "ellipsis",
          overflow: "hidden",
          ...(singleLineOptions
            ? { whiteSpace: "nowrap" }
            : {
                display: "-webkit-box",
                WebkitLineClamp: "2",
                WebkitBoxOrient: "vertical",
                whiteSpace: "normal",
              }),
        };
      },
      menu: (styles: CSSObjectWithLabel) => {
        return {
          ...styles,
          zIndex: 40,
          overflow: "hidden", // when using OptimizedMenuList this is needed
        };
      },
      menuList: (styles: CSSObjectWithLabel) => {
        return {
          ...styles,
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
        };
      },
      singleValue: (styles: CSSObjectWithLabel) => {
        return {
          ...omit(styles, ["color"]),
        };
      },
      multiValue: (
        styles: CSSObjectWithLabel,
        { data, theme }: MultiValueProps & ExtendComponentProps,
      ) => {
        const {
          colors: { neutral20: backgroundColor, error20: backgroundColorError },
        } = theme;
        return {
          ...styles,
          backgroundColor:
            typeof data === "object" && isDefined(data) && "isInvalid" in (data as any)
              ? backgroundColorError
              : backgroundColor,
          borderRadius: radii["sm"],
        };
      },
      multiValueRemove: (
        styles: CSSObjectWithLabel,
        { data, theme, isFocused }: MultiValueProps & ExtendComponentProps,
      ) => {
        const {
          colors: {
            neutral20: backgroundColor,
            neutral30: backgroundColorHover,
            error30: backgroundColorHoverError,
            neutral90: fontColor,
          },
        } = theme;
        return typeof data === "object" &&
          isDefined(data) &&
          "isDisabled" in data &&
          data.isDisabled
          ? { display: "none" }
          : {
              ...styles,
              backgroundColor: isFocused ? backgroundColorHover : backgroundColor,
              borderRadius: `0 ${radii["sm"]} ${radii["sm"]} 0`,
              ":hover": {
                backgroundColor:
                  typeof data === "object" &&
                  isDefined(data) &&
                  "isInvalid" in data &&
                  data.isInvalid
                    ? backgroundColorHoverError
                    : backgroundColorHover,
                color: fontColor,
              },
            };
      },
      multiValueLabel: (
        styles: CSSObjectWithLabel,
        { data }: MultiValueProps & ExtendComponentProps,
      ) => {
        return {
          ...omit(styles, ["borderRadius"]),
          paddingRight:
            typeof data === "object" && isDefined(data) && "isDisabled" in data && data.isDisabled
              ? 6
              : undefined,
        };
      },
    };
    return isDefined(_styles) ? mergeStyles(styles as any, _styles) : styles;
  }, [_styles]);

  const rehydrated = useRehydrated();
  return {
    inputId,
    isDisabled: isReadOnly || isDisabled,
    menuPortalTarget: usePortal && rehydrated ? document.body : undefined,
    menuPlacement: "auto",
    theme,
    components: {
      SelectContainer,
      IndicatorSeparator,
      ClearIndicator,
      DropdownIndicator,
      NoOptionsMessage,
      MultiValueRemove,
      LoadingMessage,
      ...props.components,
    },
    styles,
    // Extension props
    ...({ size, isInvalid, singleLineOptions } as any),
  } as any;
}

interface ExtendComponentProps {
  theme: {
    spacing: {
      padding: number;
    };
    fontSize: string;
    colors: Record<`error${"" | 10 | 20 | 30}`, string>;
  };
  selectProps: {
    singleLineOptions?: boolean;
    isInvalid?: boolean;
    size: "sm" | "md" | "lg";
  };
}

function SelectContainer({ innerProps, ...props }: ContainerProps) {
  return (
    <components.SelectContainer
      innerProps={{
        ...(props.selectProps.isLoading ? { "data-loading": "" } : {}),
        ...Object.fromEntries(
          Object.entries(props.selectProps).filter(([key]) => key.startsWith("data-")),
        ),
        ...innerProps,
      }}
      {...props}
    />
  );
}

function IndicatorSeparator() {
  return <></>;
}

function ClearIndicator({ innerProps }: ClearIndicatorProps) {
  const intl = useIntl();
  return (
    <CloseButton
      tabIndex={-1}
      aria-label={intl.formatMessage({
        id: "generic.clear",
        defaultMessage: "Clear",
      })}
      size="sm"
      {...(innerProps as any)}
    />
  );
}

function DropdownIndicator(props: DropdownIndicatorProps & ExtendComponentProps) {
  const { theme } = props;
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
}

function NoOptionsMessage() {
  return (
    <Text as="div" textStyle="hint" textAlign="center" paddingY={2}>
      <FormattedMessage id="generic.no-results" defaultMessage="No results" />
    </Text>
  );
}

function MultiValueRemove({ innerProps, ...props }: MultiValueProps) {
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
}

function LoadingMessage() {
  return (
    <Text as="div" color="gray.400" textAlign="center" paddingY={2}>
      <FormattedMessage id="component.react-select.loading" defaultMessage="Loading..." />
    </Text>
  );
}
