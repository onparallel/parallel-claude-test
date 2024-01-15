import { RefObject, useRef } from "react";
import { FieldPath, FieldValues, SetFocusOptions, UseFormSetFocus } from "react-hook-form";
import { Focusable } from "../types";
import { useUpdatingRef } from "../useUpdatingRef";

/**
 * Creates a Ref<Focusable> for dialogs initialFocusRef
 */
export function useSetFocusRef<
  TFieldValues extends FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  setFocus: UseFormSetFocus<TFieldValues>,
  name: TFieldName,
  options?: SetFocusOptions,
): RefObject<Focusable> {
  const params = useUpdatingRef({ setFocus, name, options });
  return useRef<Focusable>({
    focus() {
      const { setFocus, name, options } = params.current;
      setFocus(name, options);
    },
  });
}
