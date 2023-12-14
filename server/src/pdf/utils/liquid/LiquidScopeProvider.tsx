import { gql } from "@apollo/client";
import { PropsWithChildren, createContext, useMemo } from "react";
import { useIntl } from "react-intl";
import { buildPetitionFieldsLiquidScope } from "../../../util/liquidScope";
import { LiquidScopeProvider_PetitionBaseFragment } from "../../__types";

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
        replies {
          content
          children {
            field {
              ...LiquidScopeProvider_PetitionField
            }
            replies {
              content
            }
          }
        }
      }
    }
    fragment LiquidScopeProvider_PetitionField on PetitionField {
      id
      type
      multiple
      alias
    }
  `,
};
