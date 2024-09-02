import { gql } from "@apollo/client";
import { PropsWithChildren, createContext, useMemo } from "react";
import { useIntl } from "react-intl";
import { pick } from "remeda";
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
    return buildPetitionFieldsLiquidScope(
      {
        id: petition.id,
        fields: petition.fields.map((f) => ({
          ...pick(f, ["id", "type", "multiple", "alias", "options", "visibility", "math"]),
          children: f.children?.map((c) => ({
            ...pick(c, ["id", "type", "multiple", "alias", "options", "visibility", "math"]),
            parent: { id: f.id },
            replies: c.replies.map((r) => ({
              content: r.content,
              anonymized_at: r.isAnonymized ? new Date() : null,
            })),
          })),
          replies: f.replies.map((r) => ({
            content: r.content,
            anonymized_at: r.isAnonymized ? new Date() : null,
            children:
              r.children?.map((c) => ({
                field: pick(c.field, ["id", "type", "multiple", "alias", "options"]),
                replies: c.replies.map((r) => ({
                  content: r.content,
                  anonymized_at: r.isAnonymized ? new Date() : null,
                })),
              })) ?? null,
          })),
        })),
        variables: petition.variables.map((v) => ({ name: v.name, default_value: v.defaultValue })),
        custom_lists: petition.customLists.map((cl) => ({ name: cl.name, values: cl.values })),
        automatic_numbering_config: petition.automaticNumberingConfig
          ? { numbering_type: petition.automaticNumberingConfig.numberingType }
          : null,
      },
      intl,
    );
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
            content
            isAnonymized
          }
        }
        replies {
          content
          isAnonymized
          children {
            field {
              ...LiquidScopeProvider_PetitionField
            }
            replies {
              content
              isAnonymized
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
  `,
};
