import { gql } from "@apollo/client";
import {
  useLiquidScope_PetitionBaseFragment,
  useLiquidScope_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { isDefined, zip } from "remeda";
import { getFieldIndices, PetitionFieldIndex } from "./fieldIndices";
import { isDownloadableReply } from "./isDownloadableReply";
import { UnwrapArray } from "./types";

export function useLiquidScope(
  petition: useLiquidScope_PetitionBaseFragment | useLiquidScope_PublicPetitionFragment,
  usePreviewReplies?: boolean
) {
  return useMemo(() => {
    const indices = getFieldIndices(petition.fields);
    const scope: Record<string, any> = { petitionId: petition.id, _: {} };
    for (const [fieldIndex, field] of zip<
      PetitionFieldIndex,
      | UnwrapArray<useLiquidScope_PetitionBaseFragment["fields"]>
      | UnwrapArray<useLiquidScope_PublicPetitionFragment["fields"]>
    >(indices, petition.fields)) {
      const replies =
        field.__typename === "PetitionField" && usePreviewReplies
          ? field.previewReplies
          : field.replies;
      const value = field.multiple
        ? replies.map((r) => r.content.value)
        : replies.length > 0
        ? replies.at(-1)!.content.value
        : undefined;
      if (field.type !== "HEADING" && !isDownloadableReply(field.type)) {
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
        previewReplies @client {
          content
        }
        replies {
          content
        }
      }
    }
  `,
  PublicPetition: gql`
    fragment useLiquidScope_PublicPetition on PublicPetition {
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
