import { gql } from "@apollo/client";
import { createContext, PropsWithChildren, useMemo } from "react";
import { useIntl } from "react-intl";
import { LiquidScopeProvider_PetitionBaseFragment } from "../../__types";
import { buildPetitionFieldsLiquidScope } from "./liquidScope";

export const LiquidScopeContext = createContext<Record<string, any> | null>(null);

export function LiquidScopeProvider({
  petition,
  children,
}: PropsWithChildren<{
  petition: LiquidScopeProvider_PetitionBaseFragment;
}>) {
  const intl = useIntl();

  const scope = useMemo(() => {
    return buildPetitionFieldsLiquidScope(petition, intl);
  }, [petition.fields]);
  return <LiquidScopeContext.Provider value={scope}>{children}</LiquidScopeContext.Provider>;
}

LiquidScopeProvider.fragments = {
  PetitionBase: gql`
    fragment LiquidScopeProvider_PetitionBase on PetitionBase {
      id
      fields {
        ...LiquidScopeProvider_PetitionField
        children {
          ...LiquidScopeProvider_PetitionField
          replies {
            ...LiquidScopeProvider_PetitionFieldReply
          }
        }
        replies {
          ...LiquidScopeProvider_PetitionFieldReply
          children {
            field {
              ...LiquidScopeProvider_PetitionField
            }
            replies {
              ...LiquidScopeProvider_PetitionFieldReply
            }
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
      automaticNumberingConfig {
        numberingType
      }
      standardListDefinitions {
        listName
        values {
          key
        }
      }
    }
    fragment LiquidScopeProvider_PetitionField on PetitionField {
      id
      type
      multiple
      alias
      options
      visibility
      math
    }
    fragment LiquidScopeProvider_PetitionFieldReply on PetitionFieldReply {
      id
      content
      isAnonymized
    }
  `,
};
