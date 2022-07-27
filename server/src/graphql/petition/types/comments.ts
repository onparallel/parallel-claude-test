import { objectType, unionType } from "nexus";
import { isDefined } from "remeda";
import { toHtml } from "../../../util/slate";

export const UserOrPetitionAccess = unionType({
  name: "UserOrPetitionAccess",
  definition(t) {
    t.members("User", "PetitionAccess");
  },
  resolveType: (o) => {
    if (["User", "PetitionAccess"].includes(o.__type)) {
      return o.__type;
    }
    throw new Error("Missing __type on UserOrPetitionAccess");
  },
  sourceType: /* ts */ `
    | ({__type: "User"} & NexusGenRootTypes["User"])
    | ({__type: "PetitionAccess"} & NexusGenRootTypes["PetitionAccess"])
  `,
});

export const PetitionFieldCommentMention = unionType({
  name: "PetitionFieldCommentMention",
  definition(t) {
    t.members("PetitionFieldCommentUserMention", "PetitionFieldCommentUserGroupMention");
  },
  resolveType: (o) => {
    if (isDefined(o.__type)) {
      return `PetitionFieldComment${o.__type}Mention` as const;
    }
    throw new Error("Missing __type on UserOrPetitionAccess");
  },
  sourceType: /* ts */ `
    | {__type: "User", user_id: number}
    | {__type: "UserGroup", user_group_id: number}
  `,
});

export const PetitionFieldCommentUserMention = objectType({
  name: "PetitionFieldCommentUserMention",
  description: "A user mention on a petition field comment",
  definition(t) {
    t.globalId("mentionedId", {
      prefixName: "User",
      resolve: (o) => o.user_id,
    });
    t.nullable.field("user", {
      type: "User",
      resolve: async (o, _, ctx) => {
        return await ctx.users.loadUser(o.user_id);
      },
    });
  },
  sourceType: /* ts */ `
    {__type: "User", user_id: number}
  `,
});

export const PetitionFieldCommentUserGroupMention = objectType({
  name: "PetitionFieldCommentUserGroupMention",
  description: "A user group mention on a petition field comment",
  definition(t) {
    t.globalId("mentionedId", {
      prefixName: "UserGroup",
      resolve: (o) => o.user_group_id,
    });
    t.nullable.field("userGroup", {
      type: "UserGroup",
      resolve: async (o, _, ctx) => {
        return await ctx.userGroups.loadUserGroup(o.user_group_id);
      },
    });
  },
  sourceType: /* ts */ `
    {__type: "UserGroup", user_group_id: number}
  `,
});

export const PetitionFieldComment = objectType({
  name: "PetitionFieldComment",
  description: "A comment on a petition field",
  definition(t) {
    t.globalId("id", {
      description: "The ID of the petition field comment.",
    });
    t.nullable.field("author", {
      type: "UserOrPetitionAccess",
      description: "The author of the comment.",
      resolve: async (root, _, ctx) => {
        if (root.user_id !== null) {
          const user = await ctx.users.loadUser(root.user_id);
          return user && { __type: "User", ...user };
        } else if (root.petition_access_id !== null) {
          const access = await ctx.petitions.loadAccess(root.petition_access_id);
          return access && { __type: "PetitionAccess", ...access };
        }
        throw new Error(`Both "user_id" and "petition_access_id" are null`);
      },
    });
    t.json("content", {
      description: "The JSON content of the comment.",
      resolve: async (root, _, ctx) => {
        return root.content_json;
      },
    });
    t.string("contentHtml", {
      description: "The HTML content of the comment.",
      resolve: async (root, _, ctx) => {
        return toHtml(root.content_json);
      },
    });
    t.list.field("mentions", {
      type: "PetitionFieldCommentMention",
      description: "The mentiones of the comments.",
      resolve: async (root, _, ctx) => {
        return [];
        // TODO coger mentions de la tabla de petition_field_comment_mentions
        // return getMentions(root.content_json).map((m) => {
        //   if (m.type === "User") {
        //     return { __type: "User", user_id: m.id };
        //   } else if (m.type === "UserGroup") {
        //     return { __type: "UserGroup", user_group_id: m.id };
        //   } else {
        //     throw new Error("Unknown mention type");
        //   }
        // });
      },
    });
    t.datetime("createdAt", {
      description: "Time when the comment was created.",
      resolve: (o) => o.created_at,
    });
    t.boolean("isUnread", {
      description: "Whether the comment has been read or not.",
      resolve: async (root, _, ctx) => {
        return ctx.petitions.loadPetitionFieldCommentIsUnreadForUser({
          userId: ctx.user!.id,
          petitionId: root.petition_id,
          petitionFieldId: root.petition_field_id,
          petitionFieldCommentId: root.id,
        });
      },
    });
    t.boolean("isEdited", {
      description: "Whether the comment has been edited after being published.",
      resolve: async (root) => {
        return root.updated_at > root.created_at;
      },
    });
    t.boolean("isInternal", {
      description:
        "Whether the comment is internal (only visible to org users) or public (visible for users and accesses)",
      resolve: (root) => root.is_internal,
    });
    t.field("field", {
      type: "PetitionField",
      resolve: async (o, _, ctx) => (await ctx.petitions.loadField(o.petition_field_id))!,
    });
    t.boolean("isAnonymized", { resolve: (o) => o.anonymized_at !== null });
  },
});
