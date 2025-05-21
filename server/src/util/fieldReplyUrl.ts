import { PetitionField, PetitionFieldReply } from "../db/__types";
import { toGlobalId } from "./globalId";

export function fieldReplyUrl(
  parallelUrl: string,
  locale: string,
  field: Pick<PetitionField, "id" | "type" | "petition_id">,
  reply: Pick<PetitionFieldReply, "content" | "parent_petition_field_reply_id">,
) {
  if (field.type === "BACKGROUND_CHECK") {
    return `${parallelUrl}/${locale}/app/background-check/${
      reply.content.entity?.id ? reply.content.entity.id : "results"
    }?${new URLSearchParams({
      token: Buffer.from(
        JSON.stringify({
          petitionId: toGlobalId("Petition", field.petition_id),
          fieldId: toGlobalId("PetitionField", field.id),
          parentReplyId: reply.parent_petition_field_reply_id
            ? toGlobalId("PetitionFieldReply", reply.parent_petition_field_reply_id)
            : null,
        }),
      ).toString("base64"),
      ...(reply.content.query?.name ? { name: reply.content.query.name } : {}),
      ...(reply.content.query?.date ? { date: reply.content.query.date } : {}),
      ...(reply.content.query?.type ? { type: reply.content.query.type } : {}),
      ...(reply.content.query?.country ? { country: reply.content.query.country } : {}),
      readonly: "true",
    })}`;
  } else if (field.type === "ADVERSE_MEDIA_SEARCH") {
    return `${parallelUrl}/${locale}/app/adverse-media?${new URLSearchParams({
      token: Buffer.from(
        JSON.stringify({
          petitionId: toGlobalId("Petition", field.petition_id),
          fieldId: toGlobalId("PetitionField", field.id),
          parentReplyId: reply.parent_petition_field_reply_id
            ? toGlobalId("PetitionFieldReply", reply.parent_petition_field_reply_id)
            : null,
        }),
      ).toString("base64"),
      defaultTabIndex: "1",
      readonly: "true",
    })}`;
  } else {
    throw new Error(`Field ${field.type} not supported`);
  }
}
