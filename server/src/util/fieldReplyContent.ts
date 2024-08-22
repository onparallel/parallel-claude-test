import { fromZonedTime } from "date-fns-tz";
import { PetitionFieldType } from "../db/__types";

export function fieldReplyContent(type: PetitionFieldType, content: any) {
  return type === "DATE_TIME"
    ? {
        ...content,
        value: fromZonedTime(content.datetime, content.timezone).toISOString(),
      }
    : content;
}
