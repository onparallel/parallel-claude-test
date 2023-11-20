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
  includeSelf?: boolean;
}

interface UsePetitionFieldLogicContext {
  fieldWithIndex: [
    field: PetitionFieldLogicContext_PetitionFieldFragment,
    fieldIndex: PetitionFieldIndex,
  ];
  fieldsWithIndices: [
    field: PetitionFieldLogicContext_PetitionFieldFragment,
    fieldIndex: PetitionFieldIndex,
  ][];
  variables: PetitionFieldLogicContext_PetitionBaseFragment["variables"];
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
  const fieldsWithIndices = useAllFieldsWithIndices(petition.fields);
  const fieldIndex = fieldsWithIndices.findIndex(([f]) => f.id === field.id);
  const value = useMemo<UsePetitionFieldLogicContext>(() => {
    return {
      fieldWithIndex: fieldsWithIndices.find(([f]) => f.id === field.id)!,
      fieldsWithIndices: fieldsWithIndices
        .slice(0, includeSelf ? fieldIndex + 1 : fieldIndex)
        .filter(([f]) => !f.isReadOnly),
      variables: petition.variables,
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
        fields {
          ...PetitionFieldLogicContext_PetitionField
          children {
            ...PetitionFieldLogicContext_PetitionField
          }
        }
        variables {
          name
          defaultValue
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
