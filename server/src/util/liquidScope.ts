import { IntlShape } from "react-intl";
import { isDefined, zip } from "remeda";
import { PetitionField } from "../db/__types";
import {
  DateLiquidValue,
  DateTimeLiquidValue,
  WithLabelLiquidValue,
} from "../pdf/utils/liquid/LiquidValue";
import { getFieldsWithIndices } from "./fieldIndices";
import { FieldLogicResult } from "./fieldLogic";
import { isFileTypeField } from "./isFileTypeField";
import { Drop } from "liquidjs";

interface InnerPetitionFieldLiquidScope
  extends Pick<PetitionField, "type" | "multiple" | "alias" | "options"> {
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

function getReplyValue(
  field: Pick<PetitionField, "type" | "options">,
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
      if (isDefined(options.labels)) {
        const label =
          zip(options.labels!, options.values).find(([, v]) => v === content.value)?.[0] ?? "";
        return new WithLabelLiquidValue(intl, content, label);
      } else {
        return content.value;
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
        return content.value;
      }
    }
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
          const values = _replies.map((r) => getReplyValue(field, r.content, intl));
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
      values = replies.map((r) => getReplyValue(field, r.content, intl));
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

class PetitionVariableDrop extends Drop {
  constructor(
    public final: number,
    public after: number,
    public before: number,
  ) {
    super();
  }

  public override valueOf() {
    return this.final;
  }
}

export function buildPetitionVariablesLiquidScope(logic: FieldLogicResult) {
  return Object.fromEntries(
    Object.keys(logic.finalVariables).map((key) => [
      key,
      new PetitionVariableDrop(
        logic.finalVariables[key],
        logic.currentVariables[key],
        logic.previousVariables[key],
      ),
    ]),
  );
}
