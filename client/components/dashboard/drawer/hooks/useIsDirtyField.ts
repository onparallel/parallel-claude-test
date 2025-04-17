import { useFormContext } from "react-hook-form";
import { isNonNullish } from "remeda";

/**
 * Utility function to check if two values are semantically equivalent
 * accounting for empty arrays, objects, and undefined/null/empty strings
 */
function areValuesEquivalent(currentValue: any, defaultValue: any): boolean {
  // Both are nullish (undefined, null, empty string)
  if (!currentValue && !defaultValue) return true;

  // Handle empty arrays
  if (Array.isArray(currentValue) && Array.isArray(defaultValue)) {
    if (currentValue.length === 0 && defaultValue.length === 0) return true;
    if (currentValue.length !== defaultValue.length) return false;
    return currentValue.every((item, index) => areValuesEquivalent(item, defaultValue[index]));
  }

  // Handle empty objects
  if (
    typeof currentValue === "object" &&
    typeof defaultValue === "object" &&
    currentValue !== null &&
    defaultValue !== null
  ) {
    const keys1 = Object.keys(currentValue);
    const keys2 = Object.keys(defaultValue);

    if (keys1.length === 0 && keys2.length === 0) return true;
    if (keys1.length !== keys2.length) return false;

    return keys1.every((key) => areValuesEquivalent(currentValue[key], defaultValue[key]));
  }

  // Handle nullish vs empty cases
  if (!currentValue && defaultValue === "") return true;
  if (!defaultValue && currentValue === "") return true;
  if (!currentValue && Array.isArray(defaultValue) && defaultValue.length === 0) return true;
  if (!defaultValue && Array.isArray(currentValue) && currentValue.length === 0) return true;
  if (
    !currentValue &&
    typeof defaultValue === "object" &&
    defaultValue !== null &&
    Object.keys(defaultValue).length === 0
  )
    return true;
  if (
    !defaultValue &&
    typeof currentValue === "object" &&
    currentValue !== null &&
    Object.keys(currentValue).length === 0
  )
    return true;

  // Special case for filters and conditions
  if (
    !defaultValue &&
    typeof currentValue === "object" &&
    currentValue !== null &&
    (("filters" in currentValue && currentValue.filters.length === 0) ||
      ("conditions" in currentValue && currentValue.conditions.length === 0))
  ) {
    return true;
  }

  // Direct comparison for other types
  return currentValue === defaultValue;
}

/**
 * Custom hook to determine if a field is semantically dirty
 * Considers empty arrays/objects/strings equivalent to undefined/null
 */
export function useIsDirtyField(fieldPath?: string): boolean {
  const { formState, watch } = useFormContext();
  const { dirtyFields, defaultValues } = formState;

  if (!fieldPath) return false;
  // Get the current field value
  const currentValue = watch(fieldPath);

  // Use path notation to check if the field is marked dirty by React Hook Form
  const isDirtyByRHF = fieldPath
    .split(".")
    .reduce((obj: any, path: string) => (obj && path in obj ? obj[path] : undefined), dirtyFields);

  // If RHF doesn't think it's dirty, return false quickly
  if (
    Array.isArray(isDirtyByRHF)
      ? isDirtyByRHF.length === 0 || isDirtyByRHF.every((item) => !item)
      : !isDirtyByRHF
  ) {
    return false;
  }

  // Get the default/initial value
  let defaultValue;
  if (isNonNullish(defaultValues)) {
    defaultValue = fieldPath
      .split(".")
      .reduce(
        (obj: any, path: string) => (obj && obj[path] !== undefined ? obj[path] : undefined),
        defaultValues as object,
      );
  }

  // Compare values semantically
  return !areValuesEquivalent(currentValue, defaultValue);
}
