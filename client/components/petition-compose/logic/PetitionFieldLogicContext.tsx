import { gql } from "@apollo/client";
import {
  PetitionFieldLogicContext_PetitionBaseFragment,
  PetitionFieldLogicContext_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex, useAllFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { UnwrapArray } from "@parallel/utils/types";
import { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { pick } from "remeda";

interface PetitionFieldLogicContextProps {
  field: PetitionFieldLogicContext_PetitionFieldFragment;
  petition: PetitionFieldLogicContext_PetitionBaseFragment;
  includeSelf?: boolean;
}

type FieldOf<T extends { fields?: any[] | null }> = UnwrapArray<
  Exclude<T["fields"], null | undefined>
>;
type ChildOf<T extends { children?: any[] | null }> = UnwrapArray<
  Exclude<T["children"], null | undefined>
>;

export type PetitionFieldSelection =
  | FieldOf<PetitionFieldLogicContext_PetitionBaseFragment>
  | ChildOf<FieldOf<PetitionFieldLogicContext_PetitionBaseFragment>>;

interface UsePetitionFieldLogicContext
  extends Pick<
    PetitionFieldLogicContext_PetitionBaseFragment,
    "variables" | "customLists" | "standardListDefinitions"
  > {
  fieldWithIndex: [field: PetitionFieldSelection, fieldIndex: PetitionFieldIndex];
  fieldsWithIndices: [field: PetitionFieldSelection, fieldIndex: PetitionFieldIndex][];
  isTemplate: boolean;
}

const _PetitionFieldLogicContext = createContext<UsePetitionFieldLogicContext | undefined>(
  undefined,
);

export function PetitionFieldLogicContext({
  field,
  petition,
  children,
  includeSelf,
}: PropsWithChildren<PetitionFieldLogicContextProps>) {
  const fieldsWithIndices = useAllFieldsWithIndices(petition);
  const fieldIndex = fieldsWithIndices.findIndex(([f]) => f.id === field.id);
  const value = useMemo<UsePetitionFieldLogicContext>(() => {
    return {
      fieldWithIndex: fieldsWithIndices.find(([f]) => f.id === field.id)!,
      fieldsWithIndices: fieldsWithIndices
        .slice(0, includeSelf ? fieldIndex + 1 : fieldIndex)
        .filter(([f]) => !f.isReadOnly),
      ...pick(petition, ["variables", "customLists", "standardListDefinitions"]),
      isTemplate: petition.__typename === "PetitionTemplate",
    };
  }, [fieldsWithIndices, petition.variables]);

  return (
    <_PetitionFieldLogicContext.Provider value={value}>
      {children}
    </_PetitionFieldLogicContext.Provider>
  );
}

PetitionFieldLogicContext.fragments = {
  get PetitionBase() {
    return gql`
      fragment PetitionFieldLogicContext_PetitionBase on PetitionBase {
        id
        fields {
          id
          ...PetitionFieldLogicContext_PetitionField
          parent {
            id
          }
          children {
            id
            ...PetitionFieldLogicContext_PetitionField
            parent {
              id
            }
          }
        }
        variables {
          name
          defaultValue
        }
        customLists {
          name
          values
        }
        standardListDefinitions {
          id
          listName
          listType
          title
          listVersion
          versionFormat
        }
        ...useAllFieldsWithIndices_PetitionBase
      }
      fragment PetitionFieldLogicContext_PetitionField on PetitionField {
        id
        title
        type
        multiple
        options
        isReadOnly
        isChild
      }
      ${useAllFieldsWithIndices.fragments.PetitionBase}
    `;
  },
};

export function usePetitionFieldLogicContext() {
  return useContext(_PetitionFieldLogicContext)!;
}
