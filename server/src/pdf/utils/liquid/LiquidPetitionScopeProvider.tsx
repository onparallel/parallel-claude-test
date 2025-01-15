import { gql } from "@apollo/client";
import { PropsWithChildren } from "react";
import { IntlShape, useIntl } from "react-intl";
import { isNonNullish, zip } from "remeda";
import { PetitionFieldType } from "../../../db/__types";
import { getFieldsWithIndices } from "../../../util/fieldIndices";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { LiquidPetitionScopeProvider_PetitionBaseFragment } from "../../__types";
import { evaluateFieldLogic } from "../fieldLogic";
import { LiquidScopeProvider } from "./LiquidScopeProvider";
import { DateLiquidValue, DateTimeLiquidValue, WithLabelLiquidValue } from "./LiquidValue";

export function LiquidPetitionScopeProvider({
  petition,
  children,
}: PropsWithChildren<{
  petition: LiquidPetitionScopeProvider_PetitionBaseFragment;
}>) {
  const intl = useIntl();
  return (
    <LiquidScopeProvider scope={buildPetitionFieldsLiquidScope(petition, intl)}>
      {children}
    </LiquidScopeProvider>
  );
}

export function buildPetitionFieldsLiquidScope(petition: FieldLogicPetitionInput, intl: IntlShape) {
  const fieldsWithIndices = getFieldsWithIndices(petition.fields);
  const fieldLogic = evaluateFieldLogic(petition);
  const scope: Record<string, any> = { petitionId: petition.id, _: {} };

  for (const [[field, fieldIndex, childrenFieldIndices], logic] of zip(
    fieldsWithIndices,
    fieldLogic,
  )) {
    const replies = field.replies;
    let values: any[];
    if (field.type === "FIELD_GROUP") {
      values = replies.map((r) => {
        const reply: Record<string, any> = { _: {} };
        for (const [{ field, replies: _replies }, fieldIndex] of zip(
          r.children!,
          childrenFieldIndices!,
        )) {
          const values = _replies.map((r) => getReplyValue(field, r.content, intl));
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
      values = replies.map((r) => getReplyValue(field, r.content, intl));
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
}

function getReplyValue(
  field: { type: PetitionFieldType; options: any },
  content: any,
  intl: IntlShape,
) {
  switch (field.type) {
    case "DATE":
      return new DateLiquidValue(intl, content);
    case "DATE_TIME":
      return new DateTimeLiquidValue(intl, content);
    case "SELECT":
      // in case of standard SELECT lists, this options will already have it correctly filled, as it comes from a graphql query
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

interface FieldLogicPetitionFieldReplyInner {
  id: string;
  content: any;
  isAnonymized: boolean;
}

interface FieldLogicPetitionFieldInner {
  id: string;
  type: PetitionFieldType;
  options: any;
  visibility: any | null;
  math: any[] | null;
  alias: string | null;
  multiple: boolean;
}

interface FieldLogicPetitionFieldInput extends FieldLogicPetitionFieldInner {
  children?:
    | (FieldLogicPetitionFieldInner & { replies: FieldLogicPetitionFieldReplyInner[] })[]
    | null;
  replies: (FieldLogicPetitionFieldReplyInner & {
    children?:
      | {
          field: Pick<
            FieldLogicPetitionFieldInner,
            "id" | "type" | "options" | "alias" | "multiple"
          >;
          replies: FieldLogicPetitionFieldReplyInner[];
        }[]
      | null;
  })[];
}

interface FieldLogicPetitionInput {
  id: string;
  variables: { name: string; defaultValue: number }[];
  customLists: { name: string; values: string[] }[];
  automaticNumberingConfig: { numberingType: "NUMBERS" | "LETTERS" | "ROMAN_NUMERALS" } | null;
  standardListDefinitions: { listName: string; values: { key: string }[] }[];
  fields: FieldLogicPetitionFieldInput[];
}

LiquidPetitionScopeProvider.fragments = {
  PetitionBase: gql`
    fragment LiquidPetitionScopeProvider_PetitionBase on PetitionBase {
      id
      fields {
        ...LiquidPetitionScopeProvider_PetitionField
        children {
          ...LiquidPetitionScopeProvider_PetitionField
          replies {
            ...LiquidPetitionScopeProvider_PetitionFieldReply
          }
        }
        replies {
          ...LiquidPetitionScopeProvider_PetitionFieldReply
          children {
            field {
              ...LiquidPetitionScopeProvider_PetitionField
            }
            replies {
              ...LiquidPetitionScopeProvider_PetitionFieldReply
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
    fragment LiquidPetitionScopeProvider_PetitionField on PetitionField {
      id
      type
      multiple
      alias
      options
      visibility
      math
    }
    fragment LiquidPetitionScopeProvider_PetitionFieldReply on PetitionFieldReply {
      id
      content
      isAnonymized
    }
  `,
};
