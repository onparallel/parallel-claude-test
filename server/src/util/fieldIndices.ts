import { isNonNullish, zip } from "remeda";
import { PetitionField } from "../db/__types";
import { letters, numbers } from "./autoIncremental";
import { UnwrapArray } from "./types";

export type PetitionFieldIndex = string;

/** dont export */
function getFieldIndices<
  T extends Pick<PetitionField, "type"> & {
    children?: any[] | undefined | null;
  },
>(fields: T[]): [fieldIndex: PetitionFieldIndex, childrenFieldIndices: string[] | undefined][] {
  const letter = letters();
  const number = numbers();
  return fields.map((field) => {
    const fieldIndex =
      field.type === "HEADING" ? (letter.next().value as string) : `${number.next().value}`;
    const childLetter = letters();
    return [fieldIndex, field.children?.map((_) => `${fieldIndex}${childLetter.next().value}`)];
  });
}

/**
 * Returns an array of tuples [field, fieldIndex, childrenFieldIndices]
 * @param fields fields to iterate.
 */
export function getFieldsWithIndices<
  T extends Pick<PetitionField, "type"> & {
    children?: any[] | undefined | null;
  },
>(
  fields: T[],
): [field: T, fieldIndex: PetitionFieldIndex, childrenFieldIndices: string[] | undefined][] {
  return zip(fields, getFieldIndices(fields)).map(([field, [fieldIndex, childrenFieldIndices]]) => {
    return [field, fieldIndex, childrenFieldIndices];
  });
}

type ChildOf<
  T extends Pick<PetitionField, "type"> & {
    children?: any[] | undefined | null;
  },
> = UnwrapArray<Exclude<T["children"], null | undefined>>;

export function getAllFieldsWithIndices<
  T extends Pick<PetitionField, "type"> & {
    children?: any[] | undefined | null;
  },
>(fields: T[]): [field: T | ChildOf<T>, fieldIndex: PetitionFieldIndex][] {
  const fieldsWithIndices = getFieldsWithIndices(fields);
  return fieldsWithIndices.flatMap(([field, fieldIndex, childrenFieldIndices]) => {
    return [
      [field, fieldIndex],
      ...(isNonNullish(field.children)
        ? (zip(field.children, childrenFieldIndices!) as [ChildOf<T>, PetitionFieldIndex][])
        : []),
    ];
  });
}
