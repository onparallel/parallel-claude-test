import { gql } from "@apollo/client";
import { FORMATS, prettifyTimezone } from "./dates";
import { formatNumberWithPrefix } from "./formatNumberWithPrefix";
import { isFileTypeField } from "./isFileTypeField";
import { FieldOptions } from "./petitionFields";
import { IntlShape } from "react-intl";
import {
  getReplyContents_PetitionFieldFragment,
  getReplyContents_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";

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
  return isFileTypeField(type)
    ? [reply.content]
    : type === "NUMBER"
    ? [formatNumberWithPrefix(intl, reply.content.value, options as FieldOptions["NUMBER"])]
    : type === "DATE"
    ? [intl.formatDate(reply.content.value as string, { ...FORMATS.L, timeZone: "UTC" })]
    : type === "DATE_TIME"
    ? [
        `${intl.formatDate(reply.content.value as string, {
          timeZone: reply.content.timezone,
          ...FORMATS["L+LT"],
        })} (${prettifyTimezone(reply.content.timezone)})`,
      ]
    : type === "CHECKBOX"
    ? reply.content.value
    : type === "DYNAMIC_SELECT"
    ? reply.content.value.map((v: [string, string]) => v[1])
    : [reply.content.value];
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
