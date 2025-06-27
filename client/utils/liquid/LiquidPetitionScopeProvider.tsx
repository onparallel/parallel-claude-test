import { gql } from "@apollo/client";
import {
  LiquidPetitionScopeProvider_PetitionBaseFragment,
  LiquidPetitionScopeProvider_PublicPetitionFragment,
  PetitionField,
} from "@parallel/graphql/__types";
import { PropsWithChildren, useMemo } from "react";
import { useIntl } from "react-intl";
import { isNonNullish, zip } from "remeda";
import { assert } from "ts-essentials";
import { PetitionFieldIndex, useFieldsWithIndices } from "../fieldIndices";
import { useFieldLogic } from "../fieldLogic/useFieldLogic";
import { isFileTypeField } from "../isFileTypeField";
import { ArrayUnionToUnion, UnwrapArray } from "../types";
import { LiquidScopeProvider } from "./LiquidScopeProvider";
import { DateLiquidValue, DateTimeLiquidValue, WithLabelLiquidValue } from "./LiquidValue";

export function LiquidPetitionScopeProvider({
  petition,
  usePreviewReplies,
  children,
}: PropsWithChildren<{
  petition:
    | LiquidPetitionScopeProvider_PetitionBaseFragment
    | LiquidPetitionScopeProvider_PublicPetitionFragment;
  usePreviewReplies?: boolean;
}>) {
  const intl = useIntl();
  const fieldsWithIndices = useFieldsWithIndices(petition);
  const allFields = useMemo(() => {
    return petition.fields.flatMap((f) => [f, ...(f.children ?? [])]);
  }, [petition.fields]);
  const fieldLogic = useFieldLogic(petition, usePreviewReplies);
  const scope = useMemo(() => {
    const scope: Record<string, any> = { petitionId: petition.id, _: {} };
    for (const [[field, fieldIndex, childrenFieldIndices], logic] of zip(
      fieldsWithIndices,
      fieldLogic,
    )) {
      const replies =
        field.__typename === "PetitionField" && usePreviewReplies
          ? field.previewReplies
          : field.replies;
      let values: any[];
      if (field.type === "FIELD_GROUP") {
        values = replies.map((r) => {
          const reply: Record<string, any> = { _: {} };
          for (const [{ field: replyField, replies: _replies }, fieldIndex] of zip<
            UnwrapArray<Exclude<ArrayUnionToUnion<typeof replies>["children"], null | undefined>>,
            PetitionFieldIndex
          >(r.children! as any, childrenFieldIndices!)) {
            const field = allFields.find((f) => f.id === replyField.id);
            assert(isNonNullish(field), `Field ${replyField.id} not found`);
            const values = _replies.map((r) => getReplyValue(field, r.content));
            scope._[fieldIndex] = (scope._[fieldIndex] ?? []).concat(values);
            if (isNonNullish(field.alias)) {
              scope[field.alias] = scope._[fieldIndex];
            }
            const value = field.multiple ? values : values?.[0];
            if (field.type !== "HEADING" && !isFileTypeField(field.type)) {
              reply._[fieldIndex] = value;
              if (isNonNullish(field.alias)) {
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
        if (isNonNullish(field.alias)) {
          scope[field.alias] = value;
        }
      }
      if (field.type === "HEADING") {
        scope._[fieldIndex] = logic.headerNumber;
        if (isNonNullish(field.alias)) {
          scope[field.alias] = logic.headerNumber;
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
          if (isNonNullish(options.labels)) {
            const label =
              zip(options.labels!, options.values).find(([, v]) => v === content.value)?.[0] ?? "";
            return new WithLabelLiquidValue(intl, content, label);
          } else {
            return content.value;
          }
        case "CHECKBOX": {
          const options = field.options as { labels?: string[]; values: string[] };
          if (isNonNullish(options.labels)) {
            return (content.value ?? []).map((value: string) => {
              const label =
                zip(options.labels!, options.values).find(([, v]) => v === value)?.[0] ?? "";
              return new WithLabelLiquidValue(intl, { value }, label);
            });
          } else {
            return content.value;
          }
        }
        default:
          return content.value;
      }
    }
  }, [fieldsWithIndices, fieldLogic, intl.locale]);
  return <LiquidScopeProvider scope={scope}>{children}</LiquidScopeProvider>;
}

LiquidPetitionScopeProvider.fragments = {
  PetitionBase: gql`
    fragment LiquidPetitionScopeProvider_PetitionBase on PetitionBase {
      id
      fields {
        ...LiquidPetitionScopeProvider_PetitionField
        previewReplies @client {
          content
          children {
            field {
              id
            }
            replies {
              id
              content
            }
          }
        }
        replies {
          id
          content
          children {
            field {
              id
            }
            replies {
              id
              content
            }
          }
        }
        children {
          ...LiquidPetitionScopeProvider_PetitionField
        }
      }

      ...useFieldsWithIndices_PetitionBase
      ...useFieldLogic_PetitionBase
    }

    fragment LiquidPetitionScopeProvider_PetitionField on PetitionField {
      id
      type
      multiple
      alias
      options
    }

    ${useFieldsWithIndices.fragments.PetitionBase}
    ${useFieldLogic.fragments.PetitionBase}
  `,
  PublicPetition: gql`
    fragment LiquidPetitionScopeProvider_PublicPetition on PublicPetition {
      id
      fields {
        ...LiquidPetitionScopeProvider_PublicPetitionField
        replies {
          id
          content
          children {
            field {
              id
            }
            replies {
              id
              content
            }
          }
        }
        children {
          ...LiquidPetitionScopeProvider_PublicPetitionField
        }
      }

      ...useFieldsWithIndices_PublicPetition
      ...useFieldLogic_PublicPetition
    }

    fragment LiquidPetitionScopeProvider_PublicPetitionField on PublicPetitionField {
      id
      type
      multiple
      alias
      options
    }

    ${useFieldsWithIndices.fragments.PublicPetition}
    ${useFieldLogic.fragments.PublicPetition}
  `,
};
