import { gql } from "graphql-request";
import { useMemo } from "react";
import { isDefined, zip } from "remeda";
import { getFieldIndices } from "../../util/fieldIndices";
import { isFileTypeField } from "../../util/isFileTypeField";
import { useLiquidScope_PetitionBaseFragment } from "../__types";

export function useLiquidScope(petition: useLiquidScope_PetitionBaseFragment) {
  return useMemo(() => {
    const indices = getFieldIndices(petition.fields);
    const scope: Record<string, any> = { petitionId: petition.id, _: {} };
    for (const [fieldIndex, field] of zip(indices, petition.fields)) {
      const replies = field.replies;
      const value = field.multiple
        ? replies.map((r) => r.content.value)
        : replies.length > 0
        ? replies.at(-1)!.content.value
        : undefined;
      if (field.type !== "HEADING" && !isFileTypeField(field.type)) {
        scope._[fieldIndex] = value;
        if (isDefined(field.alias)) {
          scope[field.alias] = value;
        }
      }
    }
    return scope;
  }, [petition.fields]);
}

useLiquidScope.fragments = {
  PetitionBase: gql`
    fragment useLiquidScope_PetitionBase on PetitionBase {
      id
      fields {
        type
        multiple
        alias
        replies {
          content
        }
      }
    }
  `,
};
