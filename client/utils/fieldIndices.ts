import { gql } from "@apollo/client";
import {
  PetitionFieldType,
  useAllFieldsWithIndices_PetitionBaseFragment,
  useFieldsWithIndices_LandingTemplateFragment,
  useFieldsWithIndices_PetitionBaseFragment,
  useFieldsWithIndices_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { isNonNullish, zip } from "remeda";
import { UnwrapArray } from "./types";
import { letters, numbers } from "@parallel/utils/autoIncremental";

export type PetitionFieldIndex = string;

type FieldOf<T extends { fields?: any[] | null }> = UnwrapArray<
  Exclude<T["fields"], null | undefined>
>;

/** dont export */
function getFieldIndices<
  T extends {
    type: PetitionFieldType;
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

type ChildOf<T extends { children?: any[] | null }> = UnwrapArray<
  Exclude<T["children"], null | undefined>
>;

/**
 * Returns an array of tuples [field, fieldIndex, childrenFieldIndices]
 * @param fields fields to iterate.
 */
export function useFieldsWithIndices<
  T extends
    | useFieldsWithIndices_PetitionBaseFragment
    | useFieldsWithIndices_PublicPetitionFragment
    | useFieldsWithIndices_LandingTemplateFragment,
>(
  petition: T,
): [
  field: FieldOf<T>,
  fieldIndex: PetitionFieldIndex,
  childrenFieldIndices: string[] | undefined,
][] {
  return useMemo(() => {
    return zip(petition.fields as any, getFieldIndices(petition.fields as any)).map(
      ([field, [fieldIndex, childrenFieldIndices]]) => {
        return [field as FieldOf<T>, fieldIndex, childrenFieldIndices];
      },
    );
  }, [petition.fields]);
}

useFieldsWithIndices.fragments = {
  PetitionBase: gql`
    fragment useFieldsWithIndices_PetitionBase on PetitionBase {
      fields {
        id
        type
        children {
          id
        }
      }
    }
  `,
  PublicPetition: gql`
    fragment useFieldsWithIndices_PublicPetition on PublicPetition {
      fields {
        id
        type
        children {
          id
        }
      }
    }
  `,
  LandingTemplate: gql`
    fragment useFieldsWithIndices_LandingTemplate on LandingTemplate {
      fields {
        id
        type
      }
    }
  `,
};

export function useAllFieldsWithIndices<T extends useAllFieldsWithIndices_PetitionBaseFragment>(
  petition: T,
): [field: FieldOf<T> | ChildOf<FieldOf<T>>, fieldIndex: PetitionFieldIndex][] {
  const fieldsWithIndices = useFieldsWithIndices(petition);
  return useMemo(() => {
    return fieldsWithIndices.flatMap(([field, fieldIndex, childrenFieldIndices]) => {
      return [
        [field, fieldIndex],
        ...(isNonNullish(field.children)
          ? (zip(field.children, childrenFieldIndices!) as [
              ChildOf<FieldOf<T>>,
              PetitionFieldIndex,
            ][])
          : []),
      ];
    });
  }, [fieldsWithIndices]);
}

useAllFieldsWithIndices.fragments = {
  PetitionBase: gql`
    fragment useAllFieldsWithIndices_PetitionBase on PetitionBase {
      ...useFieldsWithIndices_PetitionBase
    }
    ${useFieldsWithIndices.fragments.PetitionBase}
  `,
};
