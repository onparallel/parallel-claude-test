import {
  Box,
  CloseButton,
  Flex,
  Text,
  useFormControl,
  useTheme,
} from "@chakra-ui/react";
import { ChevronDownIcon, CloseIcon } from "@parallel/chakra/icons";
import { useRehydrated } from "@parallel/utils/useRehydrated";
import { DependencyList, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  components as Components,
  GroupTypeBase,
  OptionTypeBase,
  SelectComponentsConfig,
  StylesConfig,
} from "react-select";
import { omit } from "remeda";
import { SelectProps } from "./types";

export const SIZES = {
  lg: {
    spacing: {
      controlHeight: 48,
      menuGutter: 8,
      baseUnit: 4,
    },
    paddingX: 4,
    fontSize: "md" as const,
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
    fontSize: "md" as const,
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
    fontSize: "sm" as const,
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
  placeholder?: string;
  isInvalid?: boolean;
  styles?: StylesConfig<any, any, any>;
  components?: SelectComponentsConfig<any, any, any>;
  usePortal?: boolean;
};

export function useMemoReactSelectProps<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = any,
  GroupType extends GroupTypeBase<OptionType> = never
>(
  factory: () => UseReactSelectProps,
  deps: DependencyList | undefined
): SelectProps<OptionType, IsMulti, GroupType> {
  return useReactSelectProps(useMemo(factory, deps));
}

/**
 * Generates the props necessary for styling react-select as a chakra component
 */
export function useReactSelectProps<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = any,
  GroupType extends GroupTypeBase<OptionType> = never
>({
  size = "md",
  placeholder,
  styles,
  components,
  usePortal = true,
  ...props
}: UseReactSelectProps = {}): SelectProps<OptionType, IsMulti, GroupType> {
  const intl = useIntl();
  const { colors, radii, sizes, fontSizes } = useTheme();

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

  const rehydrated = useRehydrated();
  return useMemo<SelectProps<OptionType, IsMulti, GroupType>>(
    () => ({
      placeholder,
      inputId,
      isDisabled,
      menuPortalTarget: usePortal && rehydrated ? document.body : undefined,
      menuPlacement: "auto",
      theme: (theme) => ({
        spacing: SIZES[size].spacing,
        colors: {
          ...theme.colors,
          primary: colors.blue[500],
          primary25: colors.gray[75],
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
      }),
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
          <Flex
            alignItems="center"
            paddingRight={SIZES[size].paddingX}
            paddingLeft={SIZES[size].paddingX / 2}
            color="gray.600"
          >
            <ChevronDownIcon display="block" position="relative" top="1px" />
          </Flex>
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
            <Components.MultiValueRemove
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
            </Components.MultiValueRemove>
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
        Option: ({ children, ...props }) => (
          <Components.Option {...props}>
            <Box flex="1" isTruncated>
              {children}
            </Box>
          </Components.Option>
        ),
        ...components,
      },
      styles: {
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
            fontSize: fontSizes[SIZES[size].fontSize],
          };
        },
        placeholder: (styles) => ({
          ...styles,
          color: colors.gray[400],
          whiteSpace: "nowrap",
        }),
        valueContainer: (styles) => ({
          ...omit(styles, ["padding"]),
          paddingLeft: (sizes as any)[SIZES[size].paddingX],
          paddingRight: 0,
        }),
        option: (styles) => ({
          ...styles,
          cursor: "pointer",
          padding: `0 ${SIZES[size].paddingX / 4}rem`,
          minHeight: "32px",
          display: "flex",
          alignItems: "center",
          fontSize: fontSizes[SIZES[size].fontSize],
          whiteSpace: "nowrap",
        }),
        menu: (styles) => ({
          ...styles,
          overflow: "hidden", // when using OptimizedMenuList this is needed
        }),
        menuList: (styles) => ({
          ...styles,
          padding: "0.5rem 0",
        }),
        singleValue: (styles) => omit(styles, ["color"]),
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
        ...styles,
      },
    }),
    [
      rehydrated,
      size,
      placeholder,
      inputId,
      isInvalid,
      isDisabled,
      components,
      styles,
    ]
  );
}

export function useInlineReactSelectProps<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = any,
  GroupType extends GroupTypeBase<OptionType> = never
>(props: UseReactSelectProps): SelectProps<OptionType, IsMulti, GroupType> {
  const rsProps = useReactSelectProps<OptionType, IsMulti, GroupType>(props);

  return useMemo<SelectProps<OptionType, IsMulti, GroupType>>(
    () => ({
      ...rsProps,
      styles: {
        ...rsProps.styles,
        control: (styles, data) =>
          omit(rsProps.styles?.control?.(styles, data) ?? styles, ["flexWrap"]),
        valueContainer: (styles, data) =>
          omit(rsProps.styles?.valueContainer?.(styles, data) ?? styles, [
            "flexWrap",
          ]),
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
      },
    }),
    [rsProps]
  ) as any;
}

export function useFieldSelectReactSelectProps(props: UseReactSelectProps) {
  const _reactSelectProps = useReactSelectProps(props);
  return useMemo<SelectProps>(
    () =>
      ({
        ..._reactSelectProps,
        styles: {
          ..._reactSelectProps.styles,
          menu: (styles, props) => ({
            ...styles,
            ..._reactSelectProps.styles!.menu?.(styles, props),
            zIndex: 100,
          }),
          valueContainer: (styles, props) => ({
            ...styles,
            ..._reactSelectProps.styles!.valueContainer?.(styles, props),
            paddingRight: 32,
          }),
        },
      } as typeof _reactSelectProps),
    [_reactSelectProps]
  );
}
