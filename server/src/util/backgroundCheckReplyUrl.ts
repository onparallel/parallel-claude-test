import { PetitionField, PetitionFieldReply } from "../db/__types";
import { toGlobalId } from "./globalId";

export function backgroundCheckFieldReplyUrl(
  parallelUrl: string,
  locale: string,
  field: Pick<PetitionField, "id" | "petition_id">,
  reply: Pick<PetitionFieldReply, "content">,
) {
  const token = Buffer.from(
    JSON.stringify({
      petitionId: toGlobalId("Petition", field.petition_id),
      fieldId: toGlobalId("PetitionField", field.id),
    }),
  ).toString("base64");

  return `${parallelUrl}/${locale}/app/background-check/${
    reply.content.entity?.id ? reply.content.entity.id : "results"
  }?${new URLSearchParams({
    token,
    ...(reply.content.query?.name ? { name: reply.content.query.name } : {}),
    ...(reply.content.query?.date ? { date: reply.content.query.date } : {}),
    ...(reply.content.query?.type ? { type: reply.content.query.type } : {}),
    readonly: "true",
  })}`;
}
