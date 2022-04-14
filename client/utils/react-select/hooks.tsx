import { CloseButton, Flex, Text, useFormControl, useTheme } from "@chakra-ui/react";
import { ChevronDownIcon, CloseIcon } from "@parallel/chakra/icons";
import { useRehydrated } from "@parallel/utils/useRehydrated";
import { ComponentPropsWithRef, ComponentType, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  components,
  CSSObjectWithLabel,
  GroupBase,
  mergeStyles,
  SelectComponentsConfig,
  StylesConfig,
  Theme,
  Props as SelectProps,
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
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>
> extends Pick<
    SelectProps<OptionType, IsMulti, GroupType>,
    "id" | "isDisabled" | "styles" | "components"
  > {
  size?: keyof typeof SIZES;
  isInvalid?: boolean;
  usePortal?: boolean;
}

/**
 * Generates the props necessary for styling react-select as a chakra component
 */
export function useReactSelectProps<
  OptionType extends OptionBase = OptionBase,
  IsMulti extends boolean = any,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>
>({
  size = "md",
  usePortal = true,
  styles: _styles,
  ...props
}: UseReactSelectProps<OptionType, IsMulti, GroupType> = {}): SelectProps<
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

  const styles = useMemo(() => {
    const styles = rsStyles<OptionType, IsMulti, GroupType>({
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
        const { isInvalid } = selectProps;
        const {
          colors: { error, primary: borderColor, neutral30: borderColorHover },
          fontSize,
        } = theme;
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
          pointerEvents: isDisabled ? "none" : undefined,
          fontSize: fontSize,
          "&:hover": {
            borderColor: isInvalid ? error : isFocused ? borderColor : borderColorHover,
          },
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
        } = theme;
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
        } = theme;
        return {
          ...styles,
          cursor: "pointer",
          padding: `6px ${padding}px`,
          fontSize: fontSize,
          overflow: "hidden",
          textOverflow: "ellipsis",
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
      singleValue: (styles, { selectProps }) => {
        return {
          ...omit(styles, ["color"]),
        };
      },
      multiValue: (styles, { data, theme }) => {
        const {
          colors: { neutral20: backgroundColor, error20: backgroundColorError },
        } = theme;
        return {
          ...styles,
          backgroundColor:
            typeof data === "object" && isDefined(data) && "isInvalid" in data
              ? backgroundColorError
              : backgroundColor,
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
            backgroundColor:
              typeof data === "object" && isDefined(data) && "isInvalid" in data
                ? backgroundColorHoverError
                : backgroundColorHover,
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
    });
    return isDefined(_styles) ? mergeStyles(styles, _styles) : styles;
  }, [_styles]);

  const components = {
    IndicatorSeparator,
    ClearIndicator,
    DropdownIndicator,
    NoOptionsMessage,
    MultiValueRemove,
    LoadingMessage,
    ...props.components,
  } as SelectComponentsConfig<OptionType, IsMulti, GroupType>;

  const rehydrated = useRehydrated();
  return {
    inputId,
    isDisabled,
    menuPortalTarget: usePortal && rehydrated ? document.body : undefined,
    menuPlacement: "auto",
    theme,
    components,
    styles,
    // Extension props
    ...({ size, isInvalid } as any),
  };
}

export type ExtendComponentProps = {
  theme: {
    spacing: {
      padding: number;
    };
    fontSize: string;
    colors: Record<`error${"" | 10 | 20 | 30}`, string>;
  };
  selectProps: {
    isInvalid?: boolean;
    size: "sm" | "md" | "lg";
  };
};

type SelectStyles = keyof StylesConfig;
type _SelectStyleProps<
  T extends SelectStyles,
  Option = unknown,
  IsMulti extends boolean = boolean,
  Group extends GroupBase<Option> = GroupBase<Option>
> = Parameters<Exclude<StylesConfig<Option, IsMulti, Group>[T], undefined>>[1];
type _StylesConfigFunction<Props> = (base: CSSObjectWithLabel, props: Props) => CSSObjectWithLabel;

export function rsStyles<
  Option = unknown,
  IsMulti extends boolean = boolean,
  Group extends GroupBase<Option> = GroupBase<Option>
>(styles: {
  [K in SelectStyles]?: _StylesConfigFunction<
    _SelectStyleProps<K, Option, IsMulti, Group> & ExtendComponentProps
  >;
}): StylesConfig<Option, IsMulti, Group> {
  return styles as any;
}

export function genericRsComponent<
  Option = unknown,
  IsMulti extends boolean = boolean,
  Group extends GroupBase<Option> = GroupBase<Option>,
  TProps extends {} = {}
>() {
  return <TComponent extends keyof SelectComponentsConfig<Option, IsMulti, Group>>(
    name: TComponent,
    component: ComponentType<
      ComponentPropsWithRef<
        NonNullable<SelectComponentsConfig<Option, IsMulti, Group>[TComponent]>
      > &
        TProps &
        ExtendComponentProps
    >
  ): NonNullable<SelectComponentsConfig<Option, IsMulti, Group>[TComponent]> => {
    return (
      process.env.NODE_ENV === "development"
        ? Object.assign(component, { displayName: name })
        : component
    ) as any;
  };
}

export const rsComponent = genericRsComponent<any, any, any>();

const IndicatorSeparator = rsComponent("IndicatorSeparator", function () {
  return <></>;
});

const ClearIndicator = rsComponent("ClearIndicator", function ({ innerProps }) {
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
});

const DropdownIndicator = rsComponent("DropdownIndicator", function (props) {
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
});

const NoOptionsMessage = rsComponent("NoOptionsMessage", function () {
  return (
    <Text as="div" textStyle="hint" textAlign="center" paddingY={2}>
      <FormattedMessage id="component.react-select.no-options" defaultMessage="No options" />
    </Text>
  );
});

const MultiValueRemove = rsComponent("MultiValueRemove", function ({ innerProps, ...props }) {
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
});

const LoadingMessage = rsComponent("LoadingMessage", function () {
  return (
    <Text as="div" color="gray.400" textAlign="center" paddingY={2}>
      <FormattedMessage id="component.react-select.loading" defaultMessage="Loading..." />
    </Text>
  );
});
