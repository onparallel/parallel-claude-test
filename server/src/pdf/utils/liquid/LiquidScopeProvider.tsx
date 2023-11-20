import { gql } from "@apollo/client";
import { PropsWithChildren, createContext, useMemo } from "react";
import { useIntl } from "react-intl";
import { isDefined, zip } from "remeda";
import { getFieldsWithIndices } from "../../../util/fieldIndices";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { LiquidScopeProvider_PetitionBaseFragment, PetitionFieldType } from "../../__types";
import { DateLiquidValue, DateTimeLiquidValue } from "./LiquidValue";

export const LiquidScopeContext = createContext<Record<string, any> | null>(null);

export function LiquidScopeProvider({
  petition,
  children,
}: PropsWithChildren<{
  petition: LiquidScopeProvider_PetitionBaseFragment;
}>) {
  const intl = useIntl();
  const fieldsWithIndices = getFieldsWithIndices(petition.fields);
  const scope = useMemo(() => {
    const scope: Record<string, any> = { petitionId: petition.id, _: {} };
    for (const [field, fieldIndex, childrenFieldIndices] of fieldsWithIndices) {
      const replies = field.replies;
      let values: any[];
      if (field.type === "FIELD_GROUP") {
        values = replies.map((r) => {
          const reply: Record<string, any> = { _: {} };
          for (const [{ field, replies: _replies }, fieldIndex] of zip(
            r.children!,
            childrenFieldIndices!,
          )) {
            const values = _replies.map((r) => getReplyValue(field.type, r.content));
            scope._[fieldIndex] = (scope._[fieldIndex] ?? []).concat(values);
            if (isDefined(field.alias)) {
              scope[field.alias] = scope._[fieldIndex];
            }
            const value = field.multiple ? values : values?.[0];
            if (field.type !== "HEADING" && !isFileTypeField(field.type)) {
              reply._[fieldIndex] = value;
              if (isDefined(field.alias)) {
                reply[field.alias] = value;
              }
            }
          }
          return reply;
        });
      } else {
        values = replies.map((r) => getReplyValue(field.type, r.content));
      }
      const value = field.multiple ? values : values?.[0];
      if (field.type !== "HEADING" && !isFileTypeField(field.type)) {
        scope._[fieldIndex] = value;
        if (isDefined(field.alias)) {
          scope[field.alias] = value;
        }
      }
    }
    return scope;

    function getReplyValue(type: PetitionFieldType, content: any) {
      switch (type) {
        case "DATE":
          return new DateLiquidValue(intl, content);
        case "DATE_TIME":
          return new DateTimeLiquidValue(intl, content);
        default:
          return content.value;
      }
    }
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
