import { gql } from "@apollo/client";
import {
  getReplyContents_PetitionFieldFragment,
  getReplyContents_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { IntlShape } from "react-intl";
import { isDefined } from "remeda";
import { FORMATS, prettifyTimezone } from "./dates";
import { formatNumberWithPrefix } from "./formatNumberWithPrefix";
import { isFileTypeField } from "./isFileTypeField";
import { FieldOptions } from "./petitionFields";
import { assertType } from "./types";

export function getReplyContents({
  intl,
  petitionField,
  reply,
}: {
  intl: IntlShape;
  petitionField: getReplyContents_PetitionFieldFragment;
  reply: getReplyContents_PetitionFieldReplyFragment;
}): any[] {
  const { type, options } = petitionField;
  if (isFileTypeField(type)) {
    return [reply.content];
  } else if (type === "NUMBER") {
    return [formatNumberWithPrefix(intl, reply.content.value, options as FieldOptions["NUMBER"])];
  } else if (type === "DATE") {
    return [intl.formatDate(reply.content.value as string, { ...FORMATS.L, timeZone: "UTC" })];
  } else if (type === "DATE_TIME") {
    return [
      `${intl.formatDate(reply.content.value as string, {
        timeZone: reply.content.timezone,
        ...FORMATS["L+LT"],
      })} (${prettifyTimezone(reply.content.timezone)})`,
    ];
  } else if (type === "CHECKBOX") {
    assertType<FieldOptions["CHECKBOX"]>(options);
    if (isDefined(options.labels)) {
      return (reply.content.value as string[]).map((value) => {
        const index = options.values.indexOf(value);
        return [index >= 0 ? options.labels![index] : value];
      });
    } else {
      return reply.content.value;
    }
  } else if (type === "SELECT") {
    assertType<FieldOptions["SELECT"]>(options);
    if (isDefined(options.labels)) {
      const index = options.values.indexOf(reply.content.value);
      return [index >= 0 ? options.labels[index] : reply.content.value];
    } else {
      return [reply.content.value];
    }
  } else if (type === "DYNAMIC_SELECT") {
    return reply.content.value.map((v: [string, string]) => v[1]);
  } else {
    return [reply.content.value];
  }
}

getReplyContents.fragments = {
  get PetitionFieldReply() {
    return gql`
      fragment getReplyContents_PetitionFieldReply on PetitionFieldReply {
        content
      }
    `;
  },
  get PetitionField() {
    return gql`
      fragment getReplyContents_PetitionField on PetitionField {
        type
        options
      }
    `;
  },
};
