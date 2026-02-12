import { RefAttributes, useMemo } from "react";
import { Box } from "@parallel/components/ui";
import { Checkbox, ThemeTypings } from "@chakra-ui/react";
import { CSSObjectWithLabel, OptionProps, components, mergeStyles } from "react-select";
import { isNonNullish, omit } from "remeda";
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

interface ReactSelectExtraProps {
  checkboxColorScheme?: ThemeTypings["colorSchemes"];
}

export interface MultiCheckboxSimpleSelectProps<
  T extends string = string,
  OptionType extends SimpleOption<T> = SimpleOption<T>,
> extends SimpleSelectProps<T, true, OptionType>,
    ReactSelectExtraProps {}

export function MultiCheckboxSimpleSelect<
  T extends string = string,
  OptionType extends SimpleOption<T> = SimpleOption<T>,
>({
  styles: _styles,
  components,
  ...props
}: MultiCheckboxSimpleSelectProps<T, OptionType> &
  RefAttributes<MultiCheckboxSimpleSelectInstance<T, OptionType>>) {
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
    return isNonNullish(_styles) ? mergeStyles(styles, _styles) : styles;
  }, [_styles]);

  return (
    <SimpleSelect<T, true, OptionType>
      isMulti
      hideSelectedOptions={false}
      closeMenuOnSelect={false}
      styles={styles}
      components={{
        Option: Option as any,
        ...components,
      }}
      {...props}
    />
  );
}

function Option({
  innerProps,
  children,
  ...props
}: OptionProps<SimpleOption, true> & {
  selectProps: ReactSelectExtraProps;
}) {
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
        colorScheme={props.selectProps.checkboxColorScheme}
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
