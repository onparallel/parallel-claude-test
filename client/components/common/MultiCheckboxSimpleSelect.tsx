import { Box, Checkbox } from "@chakra-ui/react";
import { ForwardedRef, ReactElement, RefAttributes, forwardRef, useMemo } from "react";
import { CSSObjectWithLabel, OptionProps, components, mergeStyles } from "react-select";
import { isDefined, omit } from "remeda";
import {
  SimpleOption,
  SimpleSelect,
  SimpleSelectInstance,
  SimpleSelectProps,
} from "./SimpleSelect";

export type MultiCheckboxSimpleSelectInstance<
  T extends string = string,
  OptionType extends SimpleOption<T> = SimpleOption<T>,
> = SimpleSelectInstance<T, true, OptionType>;

export type MultiCheckboxSimpleSelectProps<
  T extends string = string,
  OptionType extends SimpleOption<T> = SimpleOption<T>,
> = SimpleSelectProps<T, true, OptionType>;

export const MultiCheckboxSimpleSelect = forwardRef(function MultiCheckboxSimpleSelect<
  T extends string = string,
  OptionType extends SimpleOption<T> = SimpleOption<T>,
>(
  { styles: _styles, components, ...props }: MultiCheckboxSimpleSelectProps<T, OptionType>,
  ref: ForwardedRef<MultiCheckboxSimpleSelectInstance<T, OptionType>>,
) {
  const styles = useMemo(() => {
    const styles = {
      option: (base: CSSObjectWithLabel, props: OptionProps<OptionType>) => {
        return {
          ...omit(base, ["whiteSpace", "WebkitLineClamp", "WebkitBoxOrient"]),
          ...(props.isFocused
            ? {
                backgroundColor: "#f4f7f9",
                color: "inherit",
              }
            : props.isSelected
              ? {
                  backgroundColor: "transparent",
                  color: "inherit",
                }
              : {}),
          display: "flex",
        };
      },
    };
    return isDefined(_styles) ? mergeStyles(styles, _styles) : styles;
  }, [_styles]);

  return (
    <SimpleSelect
      ref={ref}
      isMulti
      hideSelectedOptions={false}
      closeMenuOnSelect={false}
      styles={styles}
      components={{
        Option,
        ...components,
      }}
      {...(props as any)}
    />
  );
}) as <T extends string = string, OptionType extends SimpleOption<T> = SimpleOption<T>>(
  props: MultiCheckboxSimpleSelectProps<T, OptionType> &
    RefAttributes<MultiCheckboxSimpleSelectInstance<T, OptionType>>,
) => ReactElement;

function Option({ innerProps, children, ...props }: OptionProps<SimpleOption>) {
  return (
    <components.Option
      innerProps={{ ...innerProps, "data-value": props.data.value } as any}
      {...props}
    >
      <Checkbox
        role="presentation"
        isChecked={props.isSelected}
        pointerEvents="none"
        inputProps={{ "aria-hidden": true }}
      />
      <Box
        marginStart={2}
        flex={1}
        minWidth={0}
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        {children}
      </Box>
    </components.Option>
  );
}
