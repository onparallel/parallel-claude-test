import { gql } from "@apollo/client";
import {
  LiquidScopeProvider_PetitionBaseFragment,
  LiquidScopeProvider_PublicPetitionFragment,
  PetitionField,
} from "@parallel/graphql/__types";
import { PropsWithChildren, createContext, useMemo } from "react";
import { useIntl } from "react-intl";
import { isDefined, zip } from "remeda";
import { PetitionFieldIndex, useFieldsWithIndices } from "../fieldIndices";
import { isFileTypeField } from "../isFileTypeField";
import { ArrayUnionToUnion, UnwrapArray } from "../types";
import { DateLiquidValue, DateTimeLiquidValue, WithLabelLiquidValue } from "./LiquidValue";

export const LiquidScopeContext = createContext<Record<string, any> | null>(null);

export function LiquidScopeProvider({
  petition,
  usePreviewReplies,
  children,
}: PropsWithChildren<{
  petition: LiquidScopeProvider_PetitionBaseFragment | LiquidScopeProvider_PublicPetitionFragment;
  usePreviewReplies?: boolean;
}>) {
  const intl = useIntl();
  const fieldsWithIndices = useFieldsWithIndices(
    petition.fields as (
      | UnwrapArray<LiquidScopeProvider_PetitionBaseFragment["fields"]>
      | UnwrapArray<LiquidScopeProvider_PublicPetitionFragment["fields"]>
    )[],
  );
  const scope = useMemo(() => {
    const scope: Record<string, any> = { petitionId: petition.id, _: {} };
    for (const [field, fieldIndex, childrenFieldIndices] of fieldsWithIndices) {
      const replies =
        field.__typename === "PetitionField" && usePreviewReplies
          ? field.previewReplies
          : field.replies;
      let values: any[];
      if (field.type === "FIELD_GROUP") {
        values = replies.map((r) => {
          const reply: Record<string, any> = { _: {} };
          for (const [{ field, replies: _replies }, fieldIndex] of zip<
            UnwrapArray<Exclude<ArrayUnionToUnion<typeof replies>["children"], null | undefined>>,
            PetitionFieldIndex
          >(r.children! as any, childrenFieldIndices!)) {
            const values = _replies.map((r) => getReplyValue(field, r.content));
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
        values = replies.map((r) => getReplyValue(field, r.content));
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

    function getReplyValue(field: Pick<PetitionField, "type" | "options">, content: any) {
      switch (field.type) {
        case "DATE":
          return new DateLiquidValue(intl, content);
        case "DATE_TIME":
          return new DateTimeLiquidValue(intl, content);
        case "SELECT":
          const options = field.options as { labels?: string[]; values: string[] };
          if (isDefined(options.labels)) {
            const label =
              zip(options.labels!, options.values).find(([, v]) => v === content.value)?.[0] ?? "";
            return new WithLabelLiquidValue(intl, content, label);
          } else {
            return new WithLabelLiquidValue(intl, content, content.value);
          }
        case "CHECKBOX": {
          const options = field.options as { labels?: string[]; values: string[] };
          if (isDefined(options.labels)) {
            return (content.value ?? []).map((value: string) => {
              const label =
                zip(options.labels!, options.values).find(([, v]) => v === value)?.[0] ?? "";
              return new WithLabelLiquidValue(intl, { value }, label);
            });
          } else {
            return (content.value ?? []).map((value: string) => {
              return new WithLabelLiquidValue(intl, { value }, value);
            });
          }
        }
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
        previewReplies @client {
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
      options
    }
  `,
  PublicPetition: gql`
    fragment LiquidScopeProvider_PublicPetition on PublicPetition {
      id
      fields {
        ...LiquidScopeProvider_PublicPetitionField
        replies {
          content
          children {
            field {
              ...LiquidScopeProvider_PublicPetitionField
            }
            replies {
              content
            }
          }
        }
      }
    }
    fragment LiquidScopeProvider_PublicPetitionField on PublicPetitionField {
      id
      type
      multiple
      alias
      options
    }
  `,
};
