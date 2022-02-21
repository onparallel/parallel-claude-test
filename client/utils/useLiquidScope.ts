import { gql } from "@apollo/client";
import {
  PetitionFieldType,
  useLiquidScope_PetitionFieldFragment,
  useLiquidScope_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { isDefined, zip } from "remeda";
import { getFieldIndices, PetitionFieldIndex } from "./fieldIndices";

export function useLiquidScope(
  fields: useLiquidScope_PetitionFieldFragment[] | useLiquidScope_PublicPetitionFieldFragment[],
  usePreviewReplies?: boolean
) {
  return useMemo(() => {
    const indices = getFieldIndices(fields);
    const scope: Record<string, any> = { _: {} };
    for (const [fieldIndex, field] of zip<
      PetitionFieldIndex,
      useLiquidScope_PetitionFieldFragment | useLiquidScope_PublicPetitionFieldFragment
    >(indices, fields)) {
      const replies =
        field.__typename === "PetitionField" && usePreviewReplies
          ? field.previewReplies
          : field.replies;
      const value = field.multiple
        ? replies.map((r) => getReplyValue(field.type, r.content))
        : replies.length > 0
        ? getReplyValue(field.type, replies.at(-1)!.content)
        : undefined;
      if (field.type !== "HEADING" && field.type !== "FILE_UPLOAD") {
        scope._[fieldIndex] = value;
        if (isDefined(field.alias)) {
          scope[field.alias] = value;
        }
      }
    }
    return scope;
  }, [fields]);
}

function getReplyValue(type: PetitionFieldType, content: any) {
  switch (type) {
    case "DYNAMIC_SELECT":
      return content.columns as [string, string][];
    case "CHECKBOX":
      return content.choices as string[];
    case "TEXT":
      return content.text as string;
    case "SHORT_TEXT":
      return content.text as string;
    case "SELECT":
      return content.text as string;
    case "NUMBER":
      return content.value as number;
    case "DATE":
      return content.value as string;
    case "PHONE":
      return content.value as string;
    default:
      return undefined;
  }
}

useLiquidScope.fragments = {
  PetitionField: gql`
    fragment useLiquidScope_PetitionField on PetitionField {
      type
      multiple
      alias
      previewReplies @client {
        content
      }
      replies {
        content
      }
    }
  `,
  PublicPetitionField: gql`
    fragment useLiquidScope_PublicPetitionField on PublicPetitionField {
      type
      multiple
      alias
      replies {
        content
      }
    }
  `,
};
