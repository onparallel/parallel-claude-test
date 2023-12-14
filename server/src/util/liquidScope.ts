import { IntlShape } from "react-intl";
import { isDefined, zip } from "remeda";
import { PetitionField, PetitionFieldType } from "../db/__types";
import { DateLiquidValue, DateTimeLiquidValue } from "../pdf/utils/liquid/LiquidValue";
import { getFieldsWithIndices } from "./fieldIndices";
import { FieldLogicResult } from "./fieldLogic";
import { isFileTypeField } from "./isFileTypeField";

interface InnerPetitionFieldLiquidScope extends Pick<PetitionField, "type" | "multiple" | "alias"> {
  id: string;
}

interface PetitionFieldLiquidScope extends InnerPetitionFieldLiquidScope {
  replies: {
    content: any;
    children:
      | {
          field: InnerPetitionFieldLiquidScope;
          replies: {
            content: any;
          }[];
        }[]
      | null;
  }[];
}

interface PetitionLiquidScope {
  id: string;
  fields: PetitionFieldLiquidScope[];
}

function getReplyValue(type: PetitionFieldType, content: any, intl: IntlShape) {
  switch (type) {
    case "DATE":
      return new DateLiquidValue(intl, content);
    case "DATE_TIME":
      return new DateTimeLiquidValue(intl, content);
    default:
      return content.value;
  }
}

export function buildPetitionFieldsLiquidScope(petition: PetitionLiquidScope, intl: IntlShape) {
  const fieldsWithIndices = getFieldsWithIndices(petition.fields);
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
          const values = _replies.map((r) => getReplyValue(field.type, r.content, intl));
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
      values = replies.map((r) => getReplyValue(field.type, r.content, intl));
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
}

export function buildPetitionVariablesLiquidScope(logic: FieldLogicResult) {
  return Object.fromEntries(
    Object.keys(logic.finalVariables).map((key) => [
      key,
      {
        after: logic.currentVariables[key],
        before: logic.previousVariables[key],
        toString() {
          return logic.finalVariables[key];
        },
      },
    ]),
  );
}
