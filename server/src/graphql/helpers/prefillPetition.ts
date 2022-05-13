import pMap from "p-map";
import { uniq } from "remeda";
import { ApiContext } from "../../context";
import { PetitionField, PetitionFieldType, User } from "../../db/__types";
import { unMaybeArray } from "../../util/arrays";
import { validateReplyValue } from "../../util/validateReplyValue";

type ParsedReply = {
  fieldId: number;
  fieldType: PetitionFieldType;
  reply: any;
};

/** prefills a given petition with replies defined in prefill argument,
 * where each key inside the object is a field alias and the value is the reply content.
 * based on the field type the value could be an array for creating multiple replies.
 * If no field is found for a given key/alias, that entry is ignored.
 * If the reply is invalid given the field options, it will be ignored.
 */
export async function prefillPetition(
  petitionId: number,
  prefill: Record<string, any>,
  owner: User,
  ctx: ApiContext
) {
  const fields = await ctx.petitions.loadFieldsForPetition(petitionId, { refresh: true });
  const replies = await parsePrefillReplies(prefill, fields);
  await pMap(
    replies,
    async ({ fieldId, fieldType, reply }) => {
      await ctx.petitions.createPetitionFieldReply(
        {
          user_id: owner.id,
          petition_field_id: fieldId,
          content: { value: reply },
          type: fieldType,
        },
        owner
      );
    },
    { concurrency: 1 }
  );
}

async function parsePrefillReplies(prefill: Record<string, any>, fields: PetitionField[]) {
  const entries = Object.entries(prefill);
  const result: ParsedReply[] = [];

  for (let i = 0; i < entries.length; i++) {
    const [alias, value] = entries[i];
    const field = fields.find((f) => f.alias === alias);
    if (!field || ["HEADING", "FILE_UPLOAD", "ES_TAX_DOCUMENTS"].includes(field.type)) {
      continue;
    }

    const fieldReplies = unMaybeArray(value);
    const singleReplies = [];

    if (field.type === "CHECKBOX") {
      if (fieldReplies.every((r) => typeof r === "string")) {
        singleReplies.push(uniq(fieldReplies));
      } else if (fieldReplies.every((r) => Array.isArray(r))) {
        singleReplies.push(...fieldReplies.map((r) => uniq(r)));
      }
    } else if (field.type === "DYNAMIC_SELECT") {
      if (fieldReplies.every((r) => typeof r === "string")) {
        singleReplies.push(fieldReplies.map((value, i) => [field.options.labels[i], value]));
      } else if (fieldReplies.every((r) => Array.isArray(r))) {
        singleReplies.push(
          ...fieldReplies.map((reply: string[]) =>
            reply.map((value, i) => [field.options.labels[i], value])
          )
        );
      }
    } else {
      singleReplies.push(...fieldReplies);
    }

    for (const reply of singleReplies) {
      try {
        validateReplyValue(field, reply);
        result.push({ fieldId: field.id, fieldType: field.type, reply });
      } catch {}
    }
  }

  return result;
}
