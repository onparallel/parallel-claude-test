import { useCallback } from "react";
import {
  FieldArrayPath,
  FieldArrayWithId,
  FieldValues,
  UseFieldArrayProps,
  UseFieldArrayReturn,
  useFieldArray,
} from "react-hook-form";
import { mapToObj } from "remeda";
import { useUpdatingRef } from "../useUpdatingRef";

interface UseFieldArrayReorderReturn<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = "id",
> extends UseFieldArrayReturn<TFieldValues, TFieldArrayName, TKeyName> {
  reorder: (values: FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[]) => void;
}

export function useFieldArrayReorder<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = "id",
>(
  props: UseFieldArrayProps<TFieldValues, TFieldArrayName, TKeyName>,
): UseFieldArrayReorderReturn<TFieldValues, TFieldArrayName, TKeyName> {
  const returns = useFieldArray(props);
  const { fields, move } = returns;
  const fieldsRef = useUpdatingRef(fields);
  const reorder = useCallback(
    (fields: FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[]) => {
      const getId = (item: FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>) =>
        item[
          (props.keyName ?? "id") as keyof FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>
        ];
      const beforeIndex = mapToObj.indexed(fieldsRef.current!, (item, i) => [getId(item), i]);
      for (let i = 0; i < fields.length; ++i) {
        const index = beforeIndex[getId(fields[i])];
        if (index > i + 1) {
          return move(index, i);
        } else if (index === i + 1) {
          for (let j = i + 1; j < fields.length; ++j) {
            if (beforeIndex[getId(fields[j])] === i) {
              return move(i, j);
            }
          }
        }
      }
    },
    [],
  );
  return { ...returns, reorder };
}
