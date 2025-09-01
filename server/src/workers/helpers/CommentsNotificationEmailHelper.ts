import pMap from "p-map";
import { pick, sortBy } from "remeda";
import { PetitionField, PetitionFieldComment } from "../../db/__types";
import { ContactRepository } from "../../db/repositories/ContactRepository";
import { UserGroupRepository } from "../../db/repositories/UserGroupRepository";
import { UserRepository } from "../../db/repositories/UserRepository";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { collectMentionsFromSlate } from "../../util/slate/mentions";
import { Maybe } from "../../util/types";

export class CommentsNotificationEmailHelper {
  constructor(
    protected users: UserRepository,
    protected contacts: ContactRepository,
    protected userGroups: UserGroupRepository,
  ) {}

  private async fetchCommentAuthor(c: PetitionFieldComment) {
    if (c.user_id) {
      const userData = await this.users.loadUserDataByUserId(c.user_id);
      if (!userData) {
        throw new Error(`UserData not found for User:${c.user_id}`);
      }
      return {
        id: `User:${c.user_id}`,
        name: fullName(userData.first_name, userData.last_name) || userData.email,
      };
    } else if (c.petition_access_id) {
      const contact = await this.contacts.loadContactByAccessId(c.petition_access_id);
      if (!contact) {
        throw new Error(`Can't find contact for access with id ${c.petition_access_id}`);
      }
      return {
        id: `Contact:${contact.id}`,
        name: fullName(contact.first_name, contact.last_name) || contact.email,
      };
    } else {
      throw new Error(`Expected user_id or petition_access_id on comment with id ${c.id}`);
    }
  }

  protected async buildFieldWithComments(
    field: Maybe<PetitionField>,
    commentsByField: Record<string, PetitionFieldComment[]>,
    userId?: number,
  ) {
    return {
      field: field ? { ...pick(field, ["id", "title", "position"]) } : null,
      comments: await pMap(
        sortBy(commentsByField[field?.id ?? "null"] ?? [], (c) => c.created_at),
        async (c) => {
          return {
            id: c.id,
            content: c.content_json,
            mentions: await pMap(
              collectMentionsFromSlate(c.content_json),
              async (m) => {
                if (m.type === "User") {
                  return { id: toGlobalId("User", m.id), highlight: m.id === userId };
                } else {
                  const groupMembers = await this.userGroups.loadUserGroupMembers(m.id);
                  return {
                    id: toGlobalId("UserGroup", m.id),
                    highlight: groupMembers.some((gm) => gm.user_id === userId),
                  };
                }
              },
              { concurrency: 1 },
            ),
            author: await this.fetchCommentAuthor(c),
          };
        },
      ),
    };
  }
}
