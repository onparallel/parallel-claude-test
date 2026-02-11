import { useReactSelectProps, UseReactSelectProps } from "@parallel/utils/react-select/hooks";
import { OptionBase } from "@parallel/utils/react-select/types";
import { If } from "@parallel/utils/types";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { Component, DependencyList, RefAttributes, useCallback, useMemo, useRef } from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import Select, {
  ActionMeta,
  components,
  OnChangeValue,
  OptionProps,
  SelectInstance,
  Props as SelectProps,
} from "react-select";
import { indexBy, isNonNullish } from "remeda";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { assert } from "ts-essentials";
import { Text } from "../ui";

export interface SimpleOption<T extends string = string> extends OptionBase {
  value: T;
  label: string;
}

export type SimpleSelectInstance<
  T extends string = string,
  IsMulti extends boolean = false,
  OptionType extends SimpleOption<T> = SimpleOption<T>,
> = SelectInstance<OptionType, IsMulti>;

export interface SimpleSelectProps<
  T extends string = string,
  IsMulti extends boolean = false,
  OptionType extends SimpleOption<T> = SimpleOption<T>,
> extends UseReactSelectProps<OptionType, IsMulti>,
    Omit<SelectProps<OptionType, IsMulti>, "value" | "onChange"> {
  as?: Component;
  value: If<IsMulti, T[], T | null>;
  onChange: (value: If<IsMulti, T[], T | null>, actionMeta: ActionMeta<OptionType>) => void;
  maxItems?: number;
}
export function toSimpleSelectOption<T extends string = string>(
  value: T | null,
): SimpleOption<T> | null {
  return value === null ? null : { value, label: value as string };
}

export function SimpleSelect<
  T extends string = string,
  IsMulti extends boolean = false,
  OptionType extends SimpleOption<T> = SimpleOption<T>,
>({
  ref,
  as,
  value,
  onChange,
  maxItems,
  ...props
}: SimpleSelectProps<T, IsMulti, OptionType> &
  RefAttributes<SimpleSelectInstance<T, IsMulti, OptionType> | null>) {
  const innerRef = useRef<SimpleSelectInstance<T, IsMulti, OptionType>>(null);
  const _ref = useMergeRefs(ref, innerRef);
  const rsProps = useReactSelectProps({
    ...props,
    components: {
      ...({ Option, NoOptionsMessage } as any),
      ...props.components,
    },
  });
  const _value = useMemo(() => {
    const _options = indexBy(
      props.options?.flatMap((o) => ("value" in o ? [o] : o.options)) ?? [],
      (o) => o.value,
    );
    if (props.isMulti) {
      return Array.isArray(value) ? value.map((o) => _options[o]) : [];
    } else {
      return isNonNullish(value) ? (_options[value as string] ?? null) : null;
    }
  }, [props.options, props.isMulti, value]);

  const handleChange = useCallback(
    (option: OnChangeValue<OptionType, IsMulti>, actionMeta: ActionMeta<OptionType>) => {
      let value: T[] | T | null = null;
      if (props.isMulti) {
        assert(Array.isArray(option));
        if (
          actionMeta.action === "select-option" &&
          isNonNullish(maxItems) &&
          option.length > maxItems
        ) {
          if (maxItems === 1) {
            // If maxItems is 1, it basically acts like a radio button
            for (const o of option.slice(0, -1) as OptionType[]) {
              onChange([] as any, { action: "remove-value", removedValue: o });
            }
            value = [option.at(-1)!.value];
          } else {
            // If maxItems > 1, we prevent selecting more than maxItems options
            value = option.slice(0, maxItems).map((o) => o.value);
          }
        } else {
          value = option.map((o) => o.value);
        }

        const input = innerRef.current?.controlRef?.querySelector("input");
        if (input) {
          setTimeout(() => {
            smoothScrollIntoView(input, {
              scrollMode: "if-needed",
              block: "center",
            });
          }, 0);
        }
      } else {
        value = (option as SimpleOption<T>)?.value ?? null;
      }
      onChange(value as any, actionMeta);
    },
    [onChange],
  );

  const Component: typeof Select = (as as any) ?? Select;
  return (
    <Component
      ref={_ref}
      getOptionValue={(o) => o.value}
      getOptionLabel={(o) => o.label}
      {...props}
      {...rsProps}
      value={_value}
      onChange={handleChange}
    />
  );
}

export function useSimpleSelectOptions<T extends string = string>(
  factory: (intl: IntlShape) => SimpleOption<T>[],
  deps: DependencyList | undefined,
): SimpleOption<T>[] {
  const intl = useIntl();
  return useMemo(() => factory(intl), [intl.locale, ...(deps ?? [])]);
}

function Option({ innerProps, ...props }: OptionProps<SimpleOption>) {
  return (
    <components.Option
      innerProps={{ ...innerProps, "data-value": props.data.value } as any}
      {...props}
    />
  );
}

function NoOptionsMessage() {
  return (
    <Text as="div" textStyle="hint" textAlign="center" paddingY={2}>
      <FormattedMessage id="generic.no-results" defaultMessage="No results" />
    </Text>
  );
}
