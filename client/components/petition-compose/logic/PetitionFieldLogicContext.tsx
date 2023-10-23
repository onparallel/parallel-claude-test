import { gql } from "@apollo/client";
import {
  PetitionFieldLogicContext_PetitionBaseFragment,
  PetitionFieldLogicContext_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex, useAllFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { PropsWithChildren, createContext, useContext, useMemo } from "react";

interface PetitionFieldLogicContextProps {
  field: PetitionFieldLogicContext_PetitionFieldFragment;
  petition: PetitionFieldLogicContext_PetitionBaseFragment;
}

interface UsePetitionFieldLogicContext {
  field: PetitionFieldLogicContext_PetitionFieldFragment;
  fieldsWithIndices: [
    field: PetitionFieldLogicContext_PetitionFieldFragment,
    fieldIndex: PetitionFieldIndex,
  ][];
}

const _PetitionFieldLogicContext = createContext<UsePetitionFieldLogicContext | undefined>(
  undefined,
);

export function PetitionFieldLogicContext({
  field,
  petition,
  children,
}: PropsWithChildren<PetitionFieldLogicContextProps>) {
  const fieldsWithIndices = useAllFieldsWithIndices(petition.fields);
  const value = useMemo<UsePetitionFieldLogicContext>(() => {
    return {
      field,
      fieldsWithIndices: fieldsWithIndices
        .slice(
          0,
          fieldsWithIndices.findIndex(([f]) => f.id === field.id),
        )
        .filter(([f]) => !f.isReadOnly),
    };
  }, [fieldsWithIndices]);

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
        fields {
          ...PetitionFieldLogicContext_PetitionField
          children {
            ...PetitionFieldLogicContext_PetitionField
          }
        }
      }
      ${this.PetitionField}
    `;
  },
  PetitionField: gql`
    fragment PetitionFieldLogicContext_PetitionField on PetitionField {
      id
      title
      type
      multiple
      options
      isReadOnly
      parent {
        id
      }
      ...useAllFieldsWithIndices_PetitionField
    }
    ${useAllFieldsWithIndices.fragments.PetitionField}
  `,
};

export function usePetitionFieldLogicContext() {
  return useContext(_PetitionFieldLogicContext)!;
}
