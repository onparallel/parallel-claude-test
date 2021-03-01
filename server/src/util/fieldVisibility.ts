/**
 * Similar code is also on /client/utils/fieldVisibility.ts
 * Don't forget to update it as well!
 */

type WithIsVisible<T> = T & { isVisible: boolean };

export interface Visibility {
  type: "SHOW" | "HIDE";
  operator: "AND" | "OR";
  conditions: FieldVisibilityCondition[];
}
export interface FieldVisibilityCondition {
  fieldId: string;
  modifier: "ANY" | "ALL" | "NONE" | "NUMBER_OF_REPLIES";
  operator:
    | "EQUAL"
    | "NOT_EQUAL"
    | "START_WITH"
    | "END_WITH"
    | "CONTAIN"
    | "NOT_CONTAIN"
    | "LESS_THAN"
    | "LESS_THAN_OR_EQUAL"
    | "GREATER_THAN"
    | "GREATER_THAN_OR_EQUAL";
  value: string | number;
}

type VisibilityField = {
  id: string;
  visibility: Visibility | null;
  replies: { content: { text: string } }[];
};

function evaluate<T extends string | number>(
  reply: T,
  operator: FieldVisibilityCondition["operator"],
  value: T
) {
  const a = typeof reply === "string" ? reply.toLowerCase() : reply;
  const b = typeof value === "string" ? value.toLowerCase() : value;
  switch (operator) {
    case "LESS_THAN":
      return a < b;
    case "LESS_THAN_OR_EQUAL":
      return a <= b;
    case "GREATER_THAN":
      return a > b;
    case "GREATER_THAN_OR_EQUAL":
      return a >= b;
    case "EQUAL":
      return a === b;
    case "NOT_EQUAL":
      return a !== b;
    case "START_WITH":
      return a.toString().startsWith(b.toString());
    case "END_WITH":
      return a.toString().endsWith(b.toString());
    case "CONTAIN":
      return a.toString().includes(b.toString());
    case "NOT_CONTAIN":
      return !a.toString().includes(b.toString());
    default:
      return false;
  }
}

function isValidCondition(
  condition: FieldVisibilityCondition,
  replies: VisibilityField["replies"]
) {
  debugger;
  switch (condition.modifier) {
    case "ANY":
      return replies.some((r) =>
        evaluate(r.content.text, condition.operator, condition.value)
      );
    case "ALL":
      return replies.every((r) =>
        evaluate(r.content.text, condition.operator, condition.value)
      );
    case "NONE":
      return !replies.some((r) =>
        evaluate(r.content.text, condition.operator, condition.value)
      );
    case "NUMBER_OF_REPLIES":
      return evaluate(replies.length, condition.operator, condition.value);
    default:
      return false;
  }
}

export function evaluateFieldVisibility<T extends VisibilityField>(
  fields: T[]
): WithIsVisible<T>[] {
  return fields.map((field) => {
    if (!field.visibility) return { ...field, isVisible: true };
    let conditionsResult: boolean;
    switch (field.visibility.operator) {
      case "OR":
        conditionsResult = field.visibility.conditions.some((c) =>
          isValidCondition(c, fields.find((f) => f.id === c.fieldId)!.replies)
        );
        break;
      case "AND":
        conditionsResult = field.visibility.conditions.every((c) =>
          isValidCondition(c, fields.find((f) => f.id === c.fieldId)!.replies)
        );
        break;
      default:
        conditionsResult = false;
        break;
    }

    return {
      ...field,
      isVisible:
        field.visibility.type === "SHOW" ? conditionsResult : !conditionsResult,
    };
  });
}
