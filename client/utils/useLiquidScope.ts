import { gql } from "@apollo/client";
import {
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
        ? replies.map((r) => r.content.value)
        : replies.length > 0
        ? replies.at(-1)!.content.value
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
