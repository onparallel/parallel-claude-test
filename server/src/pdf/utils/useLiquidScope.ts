import gql from "graphql-tag";
import { IntlShape, useIntl } from "react-intl";
import { isDefined, zip } from "remeda";
import { FORMATS, prettifyTimezone } from "../../util/dates";
import { getFieldsWithIndices } from "../../util/fieldIndices";
import { isFileTypeField } from "../../util/isFileTypeField";
import { PetitionFieldType, useLiquidScope_PetitionBaseFragment } from "../__types";

export function useLiquidScope(petition: useLiquidScope_PetitionBaseFragment) {
  const intl = useIntl();
  const scope: Record<string, any> = { petitionId: petition.id, _: {} };
  const fieldsWithIndices = getFieldsWithIndices(petition.fields);
  for (const [field, fieldIndex, childrenFieldIndices] of fieldsWithIndices) {
    let values: any[];
    if (field.type === "FIELD_GROUP") {
      values = field.replies.map((r) => {
        const reply: Record<string, any> = { _: {} };
        for (const [{ field, replies: _replies }, fieldIndex] of zip(
          r.children!,
          childrenFieldIndices!,
        )) {
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
      values = field.replies.map((r) => getReplyValue(field.type, r.content));
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
};
