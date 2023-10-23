import { gql } from "@apollo/client";
import {
  PetitionField,
  useAllFieldsWithIndices_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { isDefined, zip } from "remeda";
import { UnwrapArray } from "./types";

export type PetitionFieldIndex = string;

/**
 * Generates and increasing sequence of letter indices (same as Excel columns)
 * A, B, ... Z, AA, AB, ... AZ, BA ... ZZ, AAA, AAB, ...
 */
export function* letters() {
  const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  let counter = 0;
  while (true) {
    let remaining = counter;
    let result = "";
    while (remaining >= 0) {
      result = symbols[remaining % symbols.length] + result;
      remaining = Math.floor(remaining / symbols.length) - 1;
    }
    yield result;
    counter++;
  }
}

/**
 * Generates an increasing sequence of numbers
 */
function* numbers() {
  let counter = 0;
  while (true) {
    yield counter + 1;
    counter++;
  }
}

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
export function useFieldsWithIndices<
  T extends Pick<PetitionField, "type"> & {
    children?: any[] | undefined | null;
  },
>(
  fields: T[],
): [field: T, fieldIndex: PetitionFieldIndex, childrenFieldIndices: string[] | undefined][] {
  return useMemo(() => {
    return zip(fields, getFieldIndices(fields)).map(
      ([field, [fieldIndex, childrenFieldIndices]]) => {
        return [field, fieldIndex, childrenFieldIndices];
      },
    );
  }, [fields]);
}

type ChildOf<T extends useAllFieldsWithIndices_PetitionFieldFragment> = UnwrapArray<
  Exclude<T["children"], null | undefined>
>;

export function useAllFieldsWithIndices<T extends useAllFieldsWithIndices_PetitionFieldFragment>(
  fields: T[],
): [field: T | ChildOf<T>, fieldIndex: PetitionFieldIndex][] {
  const fieldsWithIndices = useFieldsWithIndices(fields);
  return useMemo(() => {
    return fieldsWithIndices.flatMap(([field, fieldIndex, childrenFieldIndices]) => {
      return [
        [field, fieldIndex],
        ...(isDefined(field.children)
          ? (zip(field.children, childrenFieldIndices!) as [ChildOf<T>, PetitionFieldIndex][])
          : []),
      ];
    });
  }, [fieldsWithIndices]);
}

useAllFieldsWithIndices.fragments = {
  PetitionField: gql`
    fragment useAllFieldsWithIndices_PetitionField on PetitionField {
      type
      children {
        id
      }
    }
  `,
};
