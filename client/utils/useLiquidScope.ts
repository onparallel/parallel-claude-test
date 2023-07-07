import { gql } from "@apollo/client";
import {
  PetitionFieldType,
  useLiquidScope_PetitionBaseFragment,
  useLiquidScope_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { IntlShape, useIntl } from "react-intl";
import { isDefined, zip } from "remeda";
import { FORMATS, prettifyTimezone } from "./dates";
import { getFieldIndices, PetitionFieldIndex } from "./fieldIndices";
import { isFileTypeField } from "./isFileTypeField";
import { UnwrapArray } from "./types";

export function useLiquidScope(
  petition: useLiquidScope_PetitionBaseFragment | useLiquidScope_PublicPetitionFragment,
  usePreviewReplies?: boolean,
) {
  const intl = useIntl();
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
        ? replies.map((r) => getReplyValue(field.type, r.content))
        : replies.length > 0
        ? getReplyValue(field.type, replies.at(-1)!.content)
        : undefined;
      if (field.type !== "HEADING" && !isFileTypeField(field.type)) {
        scope._[fieldIndex] = value;
        if (isDefined(field.alias)) {
          scope[field.alias] = value;
        }
      }
    }
    return scope;

    function getReplyValue(type: PetitionFieldType, content: any) {
      switch (type) {
        case "DATE":
          return new DateLiquidValue(intl, content);
        case "DATE_TIME":
          return new DateTimeLiquidValue(intl, content);
        default:
          return content.value;
      }
    }
  }, [petition.fields]);
}

export class DateTimeLiquidValue {
  readonly datetime: string;
  readonly timezone: string;
  readonly value: string;

  constructor(
    private intl: IntlShape,
    content: { datetime: string; timezone: string; value: string },
  ) {
    this.datetime = content.datetime;
    this.timezone = content.timezone;
    this.value = content.value;
  }
  toString() {
    return `${this.intl.formatDate(new Date(this.value), {
      timeZone: this.timezone,
      ...FORMATS["LLL"],
    })} (${prettifyTimezone(this.timezone)})`;
  }
}

export class DateLiquidValue {
  readonly value: string;

  constructor(
    private intl: IntlShape,
    content: { value: string },
  ) {
    this.value = content.value;
  }
  toString() {
    return this.intl.formatDate(new Date(this.value), { timeZone: "UTC", ...FORMATS["LL"] });
  }
}

useLiquidScope.fragments = {
  PetitionBase: gql`
    fragment useLiquidScope_PetitionBase on PetitionBase {
      id
      fields {
        id
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
        id
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
