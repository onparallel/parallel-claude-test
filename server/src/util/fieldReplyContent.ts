import { fromZonedTime } from "date-fns-tz";
import { omit } from "remeda";
import { PetitionFieldType } from "../db/__types";
import { fromGlobalId } from "./globalId";

export function fieldReplyContent(type: PetitionFieldType, content: any) {
  return type === "DATE_TIME"
    ? {
        ...content,
        value: fromZonedTime(content.datetime, content.timezone).toISOString(),
      }
    : type === "PROFILE_SEARCH"
      ? {
          ...omit(content, ["profileIds"]),
          value: content.profileIds.map((id: string) => fromGlobalId(id, "Profile").id),
        }
      : content;
}
