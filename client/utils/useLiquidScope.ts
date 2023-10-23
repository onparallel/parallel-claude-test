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
import { PetitionFieldIndex, useFieldsWithIndices } from "./fieldIndices";
import { isFileTypeField } from "./isFileTypeField";
import { ArrayUnionToUnion, UnwrapArray } from "./types";

export function useLiquidScope(
  petition: useLiquidScope_PetitionBaseFragment | useLiquidScope_PublicPetitionFragment,
  usePreviewReplies?: boolean,
) {
  const intl = useIntl();
  const fieldsWithIndices = useFieldsWithIndices(
    petition.fields as (
      | UnwrapArray<useLiquidScope_PetitionBaseFragment["fields"]>
      | UnwrapArray<useLiquidScope_PublicPetitionFragment["fields"]>
    )[],
  );
  return useMemo(() => {
    const scope: Record<string, any> = { petitionId: petition.id, _: {} };
    for (const [field, fieldIndex, childrenFieldIndices] of fieldsWithIndices) {
      const replies =
        field.__typename === "PetitionField" && usePreviewReplies
          ? field.previewReplies
          : field.replies;
      let values: any[];
      if (field.type === "FIELD_GROUP") {
        values = replies.map((r) => {
          const reply: Record<string, any> = { _: {} };
          for (const [{ field, replies: _replies }, fieldIndex] of zip<
            UnwrapArray<Exclude<ArrayUnionToUnion<typeof replies>["children"], null | undefined>>,
            PetitionFieldIndex
          >(r.children! as any, childrenFieldIndices!)) {
            const values = _replies.map((r) => getReplyValue(field.type, r.content));
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
        values = replies.map((r) => getReplyValue(field.type, r.content));
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

abstract class LiquidValue<T> {
  constructor(
    protected intl: IntlShape,
    public readonly content: T,
  ) {}

  abstract toString(): string;
}

export class DateTimeLiquidValue extends LiquidValue<{
  datetime: string;
  timezone: string;
  value: string;
}> {
  toString() {
    return `${this.intl.formatDate(new Date(this.content.value), {
      timeZone: this.content.timezone,
      ...FORMATS["LLL"],
    })} (${prettifyTimezone(this.content.timezone)})`;
  }
}

export class DateLiquidValue extends LiquidValue<{ value: string }> {
  toString() {
    return this.intl.formatDate(new Date(this.content.value), {
      timeZone: "UTC",
      ...FORMATS["LL"],
    });
  }
}

useLiquidScope.fragments = {
  PetitionBase: gql`
    fragment useLiquidScope_PetitionBase on PetitionBase {
      id
      fields {
        ...useLiquidScope_PetitionField
        previewReplies @client {
          content
          children {
            field {
              ...useLiquidScope_PetitionField
            }
            replies {
              content
            }
          }
        }
        replies {
          content
          children {
            field {
              ...useLiquidScope_PetitionField
            }
            replies {
              content
            }
          }
        }
      }
    }
    fragment useLiquidScope_PetitionField on PetitionField {
      id
      type
      multiple
      alias
    }
  `,
  PublicPetition: gql`
    fragment useLiquidScope_PublicPetition on PublicPetition {
      id
      fields {
        ...useLiquidScope_PublicPetitionField
        replies {
          content
          children {
            field {
              ...useLiquidScope_PublicPetitionField
            }
            replies {
              content
            }
          }
        }
      }
    }
    fragment useLiquidScope_PublicPetitionField on PublicPetitionField {
      id
      type
      multiple
      alias
    }
  `,
};
