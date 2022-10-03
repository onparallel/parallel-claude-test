import { GroupBase, Props as SelectProps } from "react-select";
import { AsyncProps } from "react-select/async";
import { AsyncCreatableProps } from "react-select/async-creatable";
import { If } from "../types";
import { UseReactSelectProps } from "./hooks";

export interface OptionBase {
  [key: string]: any;
}

type ValueType<T, IsMulti extends boolean> = If<IsMulti, T[], T | null>;

export interface CustomSelectProps<
  OptionType extends OptionBase,
  IsMulti extends boolean = false,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>
> extends UseReactSelectProps<OptionType, IsMulti, GroupType>,
    Omit<SelectProps<OptionType, IsMulti, GroupType>, "value" | "onChange"> {
  value: ValueType<OptionType, IsMulti>;
  onChange: (value: ValueType<OptionType, IsMulti>) => void;
}

export interface CustomAsyncSelectProps<
  OptionType extends OptionBase,
  IsMulti extends boolean = false,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>
> extends UseReactSelectProps<OptionType, IsMulti, GroupType>,
    Omit<AsyncProps<OptionType, IsMulti, GroupType>, "value" | "onChange"> {
  value: ValueType<OptionType, IsMulti>;
  onChange: (value: ValueType<OptionType, IsMulti>) => void;
}

export interface CustomAsyncCreatableSelectProps<
  OptionType extends OptionBase,
  IsMulti extends boolean = false,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>
> extends UseReactSelectProps<OptionType, IsMulti, GroupType>,
    Omit<AsyncCreatableProps<OptionType, IsMulti, GroupType>, "value" | "onChange"> {
  value: ValueType<OptionType, IsMulti>;
  onChange: (value: ValueType<OptionType, IsMulti>) => void;
}
