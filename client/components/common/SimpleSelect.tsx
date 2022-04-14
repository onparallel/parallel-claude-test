import { isDefined } from "@chakra-ui/utils";
import { useReactSelectProps, UseReactSelectProps } from "@parallel/utils/react-select/hooks";
import { OptionBase } from "@parallel/utils/react-select/types";
import { If } from "@parallel/utils/types";
import {
  DependencyList,
  ForwardedRef,
  forwardRef,
  ReactElement,
  RefAttributes,
  useMemo,
} from "react";
import { IntlShape, useIntl } from "react-intl";
import Select, { Props as SelectProps, SelectInstance } from "react-select";
import { indexBy } from "remeda";

export interface SimpleOption<T extends string = string> extends OptionBase {
  value: T;
  label: string;
}

export interface SimpleSelectProps<
  T extends string = string,
  IsMulti extends boolean = false,
  OptionType extends SimpleOption<T> = SimpleOption<T>
> extends UseReactSelectProps<OptionType, IsMulti>,
    Omit<SelectProps<OptionType, IsMulti>, "value" | "onChange"> {
  value: If<IsMulti, T[], T | null>;
  onChange: (value: If<IsMulti, T[], T | null>) => void;
}
export function toSimpleSelectOption<T extends string = string>(
  value: T | null
): SimpleOption<T> | null {
  return value === null ? null : { value, label: value as string };
}

export const SimpleSelect = forwardRef(function SimpleSelect<
  T extends string = string,
  IsMulti extends boolean = false,
  OptionType extends SimpleOption<T> = SimpleOption<T>
>(
  { value, onChange, ...props }: SimpleSelectProps<T, IsMulti, OptionType>,
  ref: ForwardedRef<SelectInstance<OptionType, IsMulti>>
) {
  const rsProps = useReactSelectProps(props);
  const _value = useMemo(() => {
    const _options = indexBy(
      props.options?.flatMap((o) => ("value" in o ? [o] : o.options)) ?? [],
      (o) => o.value
    );
    if (props.isMulti) {
      return Array.isArray(value) ? value.map((o) => _options[o]) : [];
    } else {
      return isDefined(value) ? _options[value as string] ?? null : null;
    }
  }, [props.options, props.isMulti, value]);
  return (
    <Select
      ref={ref}
      getOptionValue={(o) => o.value}
      getOptionLabel={(o) => o.label}
      {...props}
      {...rsProps}
      value={_value}
      onChange={(option) => {
        onChange(
          Array.isArray(option) ? option.map((o) => o.value) : (option as any)?.value ?? null
        );
      }}
    />
  );
}) as <
  T extends string = string,
  IsMulti extends boolean = false,
  OptionType extends SimpleOption<T> = SimpleOption<T>
>(
  props: SimpleSelectProps<T, IsMulti, OptionType> &
    RefAttributes<SelectInstance<OptionType, false>>
) => ReactElement;

export function useSimpleSelectOptions<T extends string = string>(
  factory: (intl: IntlShape) => SimpleOption<T>[],
  deps: DependencyList | undefined
): SimpleOption<T>[] {
  const intl = useIntl();
  return useMemo(() => factory(intl), [intl.locale, ...(deps ?? [])]);
}
