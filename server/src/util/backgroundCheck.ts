import { isDefined } from "remeda";
import { PetitionField, PetitionFieldReply } from "../db/__types";
import { ComposedPetition } from "../db/repositories/PetitionRepository";
import { EntitySearchRequest } from "../services/background-check-clients/BackgroundCheckClient";
import { applyFieldVisibility } from "./fieldLogic";
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

/**
 * This looks for BACKGROUND_CHECK fields that have autoSearchConfig with at least the "name" field replied and no entity stored
 * and builds the search query for each one in order to automatically trigger a background check search when the petition is completed.
 */
export function buildAutomatedBackgroundCheckFieldQueries(composedPetition: ComposedPetition): {
  petitionFieldId: number;
  parentPetitionFieldReplyId: number | null;
  petitionFieldReplyId: number | null;
  query: EntitySearchRequest;
}[] {
  const visibleFields = applyFieldVisibility(composedPetition);
  // first look for BACKGROUND_CHECK fields in root (no parent)
  // fields must have autoSearchConfig with at least one SHORT_TEXT replied field
  const backgroundCheckRootFields = visibleFields
    .filter(
      (f) =>
        f.type === "BACKGROUND_CHECK" &&
        isDefined(f.options.autoSearchConfig?.name) &&
        Array.isArray(f.options.autoSearchConfig.name) &&
        f.options.autoSearchConfig.name.length > 0,
    )
    .map((backgroundCheck) => {
      // for non-child fields we only need to look for Name and Date fields on root level
      const nameReplies: Pick<PetitionFieldReply, "content">[] =
        backgroundCheck.options.autoSearchConfig.name
          .map((id: number) => visibleFields.find((f) => f.id === id)?.replies?.[0]) // take only 1st reply
          .filter(isDefined);

      const nameValue =
        nameReplies
          .map((r) => r.content.value)
          .join(" ")
          .trim() || null;

      if (!isDefined(nameValue)) {
        // if name field is empty, we don't have any information to automate search so ignore.
        return null;
      }

      const dateReply = visibleFields.find(
        (field) => backgroundCheck.options.autoSearchConfig.date === field.id,
      )?.replies?.[0];

      const dateValue = dateReply?.content.value || null;

      const typeValue = backgroundCheck.options.autoSearchConfig?.type || null;

      const currentBackgroundCheckReply = backgroundCheck.replies.at(0);
      if (
        isDefined(currentBackgroundCheckReply?.content.entity) ||
        (currentBackgroundCheckReply?.content.query.name === nameValue &&
          currentBackgroundCheckReply?.content.query.date === dateValue &&
          currentBackgroundCheckReply?.content.query.type === typeValue)
      ) {
        // reply already has an specific entity stored, or query is the same
        return null;
      }

      return {
        petitionFieldId: backgroundCheck.id,
        parentPetitionFieldReplyId: null,
        petitionFieldReplyId: currentBackgroundCheckReply?.id ?? null,
        query: {
          name: nameValue,
          date: dateValue,
          type: typeValue,
        },
      };
    })
    .filter(isDefined);

  // same as before, but for BACKGROUND_CHECK children of FIELD_GROUPs
  const emptyBackgroundCheckChildFields = visibleFields
    .filter(
      (f) =>
        f.type === "FIELD_GROUP" &&
        f.replies.length > 0 &&
        f.children!.some(
          (c) =>
            c.type === "BACKGROUND_CHECK" &&
            isDefined(c.options.autoSearchConfig?.name) &&
            Array.isArray(c.options.autoSearchConfig.name) &&
            c.options.autoSearchConfig.name.length > 0,
        ),
    )
    .flatMap((fieldGroup) =>
      fieldGroup
        // get every eligible BACKGROUND_CHECK field inside the FIELD_GROUP
        .children!.filter(
          (c) =>
            c.type === "BACKGROUND_CHECK" &&
            isDefined(c.options.autoSearchConfig?.name) &&
            Array.isArray(c.options.autoSearchConfig.name) &&
            c.options.autoSearchConfig.name.length > 0,
        )
        .flatMap((backgroundCheck) =>
          // on each eligible field, create a query for each reply on the parent FIELD_GROUP
          fieldGroup.replies.map((groupReply) => {
            const nameReplies: Pick<PetitionFieldReply, "content">[] =
              backgroundCheck.options.autoSearchConfig.name
                .map(
                  (id: number) =>
                    visibleFields
                      // Name field could be a sibling of the BACKGROUND_CHECK field, or could be in root level (no parent)
                      // se we need to flatten fields and children to find the right reply
                      .flatMap((f) => [f, ...(f.children ?? [])])
                      .find((f) => f.id === id)
                      ?.replies.filter(
                        (r) =>
                          !isDefined(r.parent_petition_field_reply_id) ||
                          r.parent_petition_field_reply_id === groupReply.id,
                      )?.[0],
                )
                .filter(isDefined);

            const nameValue =
              nameReplies
                .map((r) => r.content.value)
                .join(" ")
                .trim() || null;

            if (!isDefined(nameValue)) {
              return null;
            }

            const dateReply = visibleFields
              .flatMap((f) => [f, ...(f.children ?? [])])
              .find((f) => f.id === backgroundCheck.options.autoSearchConfig.date)
              ?.replies.filter(
                (r) =>
                  !isDefined(r.parent_petition_field_reply_id) ||
                  r.parent_petition_field_reply_id === groupReply.id,
              )?.[0];

            const dateValue = dateReply?.content.value ?? null;
            const typeValue = backgroundCheck.options.autoSearchConfig?.type ?? null;

            const currentBackgroundCheckReply = groupReply.children
              ?.find((c) => c.field.id === backgroundCheck.id)
              ?.replies.at(0);
            if (
              isDefined(currentBackgroundCheckReply?.content.entity) ||
              (currentBackgroundCheckReply?.content.query.name === nameValue &&
                currentBackgroundCheckReply?.content.query.date === dateValue &&
                currentBackgroundCheckReply?.content.query.type === typeValue)
            ) {
              // reply already has an specific entity stored, or query is the same
              return null;
            }

            return {
              petitionFieldId: backgroundCheck.id,
              parentPetitionFieldReplyId: groupReply.id,
              petitionFieldReplyId: currentBackgroundCheckReply?.id ?? null,
              query: {
                name: nameValue,
                date: dateValue,
                type: typeValue,
              },
            };
          }),
        ),
    )
    .filter(isDefined);

  return [...backgroundCheckRootFields, ...emptyBackgroundCheckChildFields];
}
