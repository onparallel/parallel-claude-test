import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { Ref } from "react";
import {
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegister,
  UseFormRegisterReturn,
} from "react-hook-form";

/**
 * Calls `register` and handles the merging of the passed ref with the
 * generated one.
 */
export function useRegisterWithRef<
  T,
  TFieldValues extends FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  ref: Ref<T>,
  register: UseFormRegister<TFieldValues>,
  name: TFieldName,
  options?: RegisterOptions<TFieldValues, TFieldName>,
): UseFormRegisterReturn {
  const { ref: registerRef, ...props } = register(name, options);
  return { ref: useMergeRefs(ref, registerRef), ...props };
}
