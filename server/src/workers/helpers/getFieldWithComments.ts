import pMap from "p-map";
import { pick, sortBy } from "remeda";
import { WorkerContext } from "../../context";
import { PetitionField, PetitionFieldComment } from "../../db/__types";
import { fullName } from "../../util/fullName";

async function fetchCommentAuthor(
  c: PetitionFieldComment,
  context: WorkerContext
) {
  if (c.user_id) {
    const user = await context.users.loadUser(c.user_id);
    if (!user) {
      throw new Error(`Can't find user with id ${c.user_id}`);
    }
    return {
      id: `User:${user.id}`,
      name: fullName(user.first_name, user.last_name) || user.email,
    };
  } else if (c.petition_access_id) {
    const contact = await context.contacts.loadContactByAccessId(
      c.petition_access_id
    );
    if (!contact) {
      throw new Error(
        `Can't find contact for access with id ${c.petition_access_id}`
      );
    }
    return {
      id: `Contact:${contact.id}`,
      name: fullName(contact.first_name, contact.last_name) || contact.email,
    };
  } else {
    throw new Error(
      `Expected user_id or petition_access_id on comment with id ${c.id}`
    );
  }
}
export async function buildFieldWithComments(
  field: PetitionField,
  commentsByField: Record<string, PetitionFieldComment[]>,
  context: WorkerContext
) {
  return {
    ...pick(field, ["id", "title", "position"]),
    comments: await pMap(
      sortBy(commentsByField[field.id], (c) => c.created_at),
      async (c) => ({
        id: c.id,
        content: c.content,
        author: await fetchCommentAuthor(c, context),
      })
    ),
  };
}
