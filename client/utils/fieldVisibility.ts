import { gql } from "@apollo/client";
import {
  evaluateFieldVisibility_PublicPetitionFieldFragment,
  evaluateFieldVisibility_PetitionFieldFragment,
} from "@parallel/graphql/__types";

type VisibilityField =
  | evaluateFieldVisibility_PublicPetitionFieldFragment
  | evaluateFieldVisibility_PetitionFieldFragment;

function evaluate<T extends string | number>(a: T, operator: string, b: T) {
  switch (operator) {
    case "EQUAL":
      return a === b;
    case "NOT_EQUAL":
      return a !== b;
    case "LESS_THAN":
      return a < b;
    case "LESS_THAN_OR_EQUAL":
      return a <= b;
    case "GREATER_THAN":
      return a > b;
    case "GREATER_THAN_OR_EQUAL":
      return a >= b;
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

function isValidCondition(condition: any, replies: { content: any }[]) {
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
): Array<T & { isVisible: boolean }> {
  return fields.map((field) => {
    if (!field.visibility) return { ...field, isVisible: true };
    let conditionsResult: boolean;
    switch (field.visibility.operator) {
      case "OR":
        conditionsResult = (field.visibility.conditions as any[]).some((c) =>
          isValidCondition(c, fields.find((f) => f.id === c.fieldId)!.replies)
        );
        break;
      case "AND":
        conditionsResult = (field.visibility.conditions as any[]).every((c) =>
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

evaluateFieldVisibility.fragments = {
  PublicPetitionField: gql`
    fragment evaluateFieldVisibility_PublicPetitionField on PublicPetitionField {
      id
      visibility
      replies {
        id
        content
      }
    }
  `,
  PetitionField: gql`
    fragment evaluateFieldVisibility_PetitionField on PetitionField {
      id
      visibility
      replies {
        id
        content
      }
    }
  `,
};
