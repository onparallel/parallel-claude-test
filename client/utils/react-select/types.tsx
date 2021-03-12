import {
  OptionTypeBase,
  GroupTypeBase,
  Props as _SelectProps,
} from "react-select";
import { Props as _AsyncSelectProps } from "react-select/async";
import { Props as _AsyncCreatableSelectProps } from "react-select/async-creatable";
import { ValueProps } from "../ValueProps";

export interface CustomSelectProps<
  T,
  IsMulti extends boolean = false,
  GroupType extends GroupTypeBase<T> = never
> extends Omit<
      SelectProps<T, IsMulti, GroupType>,
      "value" | "onChange" | "options"
    >,
    ValueProps<IsMulti extends true ? T[] : T> {}

export interface SelectProps<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = false,
  GroupType extends GroupTypeBase<OptionType> = never
> extends _SelectProps<OptionType, IsMulti, GroupType> {}

export interface CustomAsyncSelectProps<
  T,
  IsMulti extends boolean = false,
  GroupType extends GroupTypeBase<T> = never
> extends Omit<
      _AsyncSelectProps<T, IsMulti, GroupType>,
      "value" | "onChange" | "options"
    >,
    ValueProps<IsMulti extends true ? T[] : T> {}

export interface AsyncSelectProps<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = any,
  GroupType extends GroupTypeBase<OptionType> = never
> extends _AsyncSelectProps<OptionType, IsMulti, GroupType> {}

export interface CustomAsyncCreatableSelectProps<
  T,
  IsMulti extends boolean = false,
  GroupType extends GroupTypeBase<T> = never
> extends Omit<
      _AsyncCreatableSelectProps<T, IsMulti, GroupType>,
      "value" | "onChange" | "options"
    >,
    ValueProps<IsMulti extends true ? T[] : T> {}

export interface AsyncCreatableSelectProps<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = any,
  GroupType extends GroupTypeBase<OptionType> = never
> extends _AsyncCreatableSelectProps<OptionType, IsMulti, GroupType> {}
